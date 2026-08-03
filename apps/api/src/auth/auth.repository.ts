import { Injectable, Inject, InternalServerErrorException } from '@nestjs/common';
import { DRIZZLE, DrizzleDB } from '../database/database.module';
import { and, eq, isNull } from 'drizzle-orm';
import {
  users,
  socialAccounts,
  invitations,
  participants,
  invitationSendLogs,
  invitationBlocklists,
  invitationLinkEvents,
  notifications,
  notificationSettings,
  inquiries,
  aiImageJobs,
  userTermAgreements,
  serviceTerms,
  faqItems,
} from '../database/schema';
import { ErrorCode } from '../common/constants/error-codes';
import { Provider } from './enums/provider.enum';

export interface UpsertSocialAccountParams {
  provider: Provider;
  providerAccountId: string;
  email?: string;
  name?: string;
  profileImageUrl?: string;
  rawProfile?: unknown;
}

export interface UpsertSocialAccountResult {
  userId: string;
  isNew: boolean;
}

@Injectable()
export class AuthRepository {
  constructor(
    @Inject(DRIZZLE)
    private readonly db: DrizzleDB,
  ) {}

  async upsertSocialAccount(
    params: UpsertSocialAccountParams,
  ): Promise<UpsertSocialAccountResult> {
    const { provider, providerAccountId, email, name, profileImageUrl } =
      params;

    try {
      return await this.db.transaction(async (tx) => {
        const existingAccount = await tx
          .select({
            userId: socialAccounts.userId,
          })
          .from(socialAccounts)
          .where(
            and(
              eq(socialAccounts.provider, provider),
              eq(socialAccounts.providerAccountId, providerAccountId),
            ),
          )
          .limit(1);

        // 1. 동일 소셜 계정이 이미 존재하면 바로 반환
        if (existingAccount.length > 0 && existingAccount[0]) {
          const userId = existingAccount[0].userId;

          const existingUser = await tx
            .select({ deletedAt: users.deletedAt })
            .from(users)
            .where(eq(users.id, userId))
            .limit(1);

          if (existingUser[0]?.deletedAt) {
            // 탈퇴한 유저 → 새 유저 생성 후 소셜 계정 재연결
            const inserted = await tx
              .insert(users)
              .values({ email, name, profileImageUrl, lastLoginAt: new Date() })
              .returning({ id: users.id });

            const newUserId = inserted[0]!.id;

            await tx
              .update(socialAccounts)
              .set({ userId: newUserId })
              .where(
                and(
                  eq(socialAccounts.provider, provider),
                  eq(socialAccounts.providerAccountId, providerAccountId),
                ),
              );

            return { userId: newUserId, isNew: true };
          }

          await tx
            .update(users)
            .set({ lastLoginAt: new Date() })
            .where(eq(users.id, userId));

          return { userId, isNew: false };
        }

        // 2. 이메일이 있으면 기존 유저와 계정 통합 시도
        if (email) {
          const existingUser = await tx
            .select({ id: users.id })
            .from(users)
            .where(and(eq(users.email, email), isNull(users.deletedAt)))
            .limit(1);

          if (existingUser.length > 0 && existingUser[0]) {
            const userId = existingUser[0].id;

            // 이 유저가 동일 provider를 아직 연결하지 않은 경우에만 통합
            const existingProviderLink = await tx
              .select({ id: socialAccounts.id })
              .from(socialAccounts)
              .where(
                and(
                  eq(socialAccounts.userId, userId),
                  eq(socialAccounts.provider, provider),
                ),
              )
              .limit(1);

            if (existingProviderLink.length === 0) {
              await tx.insert(socialAccounts).values({
                userId,
                provider,
                providerAccountId,
              });
              await tx
                .update(users)
                .set({ lastLoginAt: new Date() })
                .where(eq(users.id, userId));

              return { userId, isNew: false };
            }
          }
        }

        // 3. 신규 유저 생성
        const inserted = await tx
          .insert(users)
          .values({
            email,
            name,
            nickname: name,
            profileImageUrl,
            lastLoginAt: new Date(),
          })
          .returning({
            id: users.id,
          });

        const newUserId = inserted[0]!.id;

        await tx.insert(socialAccounts).values({
          userId: newUserId,
          provider,
          providerAccountId,
        });

        return { userId: newUserId, isNew: true };
      });
    } catch {
      throw new InternalServerErrorException({
        code: ErrorCode.DB_TRANSACTION_FAILED,
        message: '소셜 계정 처리 중 오류가 발생했습니다.',
      });
    }
  }

  async findUserById(userId: string) {
    return await this.db.query.users.findFirst({
      where: (t, { eq, isNull, and }) =>
        and(eq(t.id, userId), isNull(t.deletedAt)),
    });
  }

  async findUserByEmail(email: string) {
    return await this.db.query.users.findFirst({
      where: (t, { eq, isNull, and }) =>
        and(eq(t.email, email), isNull(t.deletedAt)),
    });
  }

  async findSocialAccountByProviderAccountId(
    provider: Provider,
    providerAccountId: string,
  ): Promise<{ userId: string } | null> {
    const rows = await this.db
      .select({ userId: socialAccounts.userId })
      .from(socialAccounts)
      .where(
        and(
          eq(socialAccounts.provider, provider),
          eq(socialAccounts.providerAccountId, providerAccountId),
        ),
      )
      .limit(1);
    return rows[0] ?? null;
  }

  async linkSocialAccount(params: {
    userId: string;
    provider: Provider;
    providerAccountId: string;
  }): Promise<void> {
    await this.db.insert(socialAccounts).values({
      userId: params.userId,
      provider: params.provider,
      providerAccountId: params.providerAccountId,
    });
  }

  // source user의 모든 데이터를 target user로 이전한 뒤 source를 soft delete.
  // 트랜잭션 안에서 18개 컬럼을 처리하며 unique 충돌 5건은 case별로 분기한다.
  async mergeUserData(sourceUserId: string, targetUserId: string): Promise<void> {
    if (sourceUserId === targetUserId) return;

    await this.db.transaction(async (tx) => {
      // 1. socialAccounts — (userId, provider) UNIQUE. 동일 provider 충돌 시 source row 삭제.
      const sourceSocials = await tx
        .select({ id: socialAccounts.id, provider: socialAccounts.provider })
        .from(socialAccounts)
        .where(eq(socialAccounts.userId, sourceUserId));
      for (const s of sourceSocials) {
        const conflict = await tx
          .select({ id: socialAccounts.id })
          .from(socialAccounts)
          .where(
            and(
              eq(socialAccounts.userId, targetUserId),
              eq(socialAccounts.provider, s.provider),
            ),
          )
          .limit(1);
        if (conflict.length > 0) {
          await tx.delete(socialAccounts).where(eq(socialAccounts.id, s.id));
        } else {
          await tx
            .update(socialAccounts)
            .set({ userId: targetUserId })
            .where(eq(socialAccounts.id, s.id));
        }
      }

      // 2. participants — (userId, invitationId) UNIQUE. host 권한 우선 보존.
      const sourceParticipants = await tx
        .select({
          id: participants.id,
          invitationId: participants.invitationId,
          memberRole: participants.memberRole,
        })
        .from(participants)
        .where(eq(participants.userId, sourceUserId));
      for (const p of sourceParticipants) {
        const conflict = await tx
          .select({
            id: participants.id,
            memberRole: participants.memberRole,
          })
          .from(participants)
          .where(
            and(
              eq(participants.userId, targetUserId),
              eq(participants.invitationId, p.invitationId),
            ),
          )
          .limit(1);
        if (conflict.length > 0) {
          // source가 host이고 target은 일반 → host 권한 보존을 위해 target row 삭제 후 source 이전
          if (
            p.memberRole === 'HOST' &&
            conflict[0]!.memberRole !== 'HOST'
          ) {
            await tx
              .delete(participants)
              .where(eq(participants.id, conflict[0]!.id));
            await tx
              .update(participants)
              .set({ userId: targetUserId })
              .where(eq(participants.id, p.id));
          } else {
            await tx.delete(participants).where(eq(participants.id, p.id));
          }
        } else {
          await tx
            .update(participants)
            .set({ userId: targetUserId })
            .where(eq(participants.id, p.id));
        }
      }

      // 3. invitationBlocklists.blockedUserId — (invitationId, blockedUserId) UNIQUE (deletedAt IS NULL).
      const sourceBlocked = await tx
        .select({ id: invitationBlocklists.id, invitationId: invitationBlocklists.invitationId })
        .from(invitationBlocklists)
        .where(eq(invitationBlocklists.blockedUserId, sourceUserId));
      for (const b of sourceBlocked) {
        const conflict = await tx
          .select({ id: invitationBlocklists.id })
          .from(invitationBlocklists)
          .where(
            and(
              eq(invitationBlocklists.blockedUserId, targetUserId),
              eq(invitationBlocklists.invitationId, b.invitationId),
              isNull(invitationBlocklists.deletedAt),
            ),
          )
          .limit(1);
        if (conflict.length > 0) {
          await tx
            .delete(invitationBlocklists)
            .where(eq(invitationBlocklists.id, b.id));
        } else {
          await tx
            .update(invitationBlocklists)
            .set({ blockedUserId: targetUserId })
            .where(eq(invitationBlocklists.id, b.id));
        }
      }
      // blockedByUserId — unique index 없음, 단순 update
      await tx
        .update(invitationBlocklists)
        .set({ blockedByUserId: targetUserId })
        .where(eq(invitationBlocklists.blockedByUserId, sourceUserId));

      // 4. userTermAgreements — (userId, termId) UNIQUE
      const sourceAgreements = await tx
        .select({ id: userTermAgreements.id, termId: userTermAgreements.termId })
        .from(userTermAgreements)
        .where(eq(userTermAgreements.userId, sourceUserId));
      for (const a of sourceAgreements) {
        const conflict = await tx
          .select({ id: userTermAgreements.id })
          .from(userTermAgreements)
          .where(
            and(
              eq(userTermAgreements.userId, targetUserId),
              eq(userTermAgreements.termId, a.termId),
            ),
          )
          .limit(1);
        if (conflict.length > 0) {
          await tx
            .delete(userTermAgreements)
            .where(eq(userTermAgreements.id, a.id));
        } else {
          await tx
            .update(userTermAgreements)
            .set({ userId: targetUserId })
            .where(eq(userTermAgreements.id, a.id));
        }
      }

      // 5. notificationSettings — userId UNIQUE
      const targetHasSettings = await tx
        .select({ userId: notificationSettings.userId })
        .from(notificationSettings)
        .where(eq(notificationSettings.userId, targetUserId))
        .limit(1);
      if (targetHasSettings.length > 0) {
        await tx
          .delete(notificationSettings)
          .where(eq(notificationSettings.userId, sourceUserId));
      } else {
        await tx
          .update(notificationSettings)
          .set({ userId: targetUserId })
          .where(eq(notificationSettings.userId, sourceUserId));
      }

      // 6. 단순 update — 충돌 가능성 없는 컬럼들
      await tx
        .update(users)
        .set({ promotedBy: targetUserId })
        .where(eq(users.promotedBy, sourceUserId));
      await tx
        .update(serviceTerms)
        .set({ createdBy: targetUserId })
        .where(eq(serviceTerms.createdBy, sourceUserId));
      await tx
        .update(faqItems)
        .set({ createdBy: targetUserId })
        .where(eq(faqItems.createdBy, sourceUserId));
      await tx
        .update(invitations)
        .set({ userId: targetUserId })
        .where(eq(invitations.userId, sourceUserId));
      await tx
        .update(invitationSendLogs)
        .set({ senderId: targetUserId })
        .where(eq(invitationSendLogs.senderId, sourceUserId));
      await tx
        .update(invitationLinkEvents)
        .set({ userId: targetUserId })
        .where(eq(invitationLinkEvents.userId, sourceUserId));
      await tx
        .update(notifications)
        .set({ userId: targetUserId })
        .where(eq(notifications.userId, sourceUserId));
      await tx
        .update(notifications)
        .set({ actorUserId: targetUserId })
        .where(eq(notifications.actorUserId, sourceUserId));
      await tx
        .update(inquiries)
        .set({ userId: targetUserId })
        .where(eq(inquiries.userId, sourceUserId));
      await tx
        .update(inquiries)
        .set({ adminId: targetUserId })
        .where(eq(inquiries.adminId, sourceUserId));
      await tx
        .update(aiImageJobs)
        .set({ userId: targetUserId })
        .where(eq(aiImageJobs.userId, sourceUserId));

      // 7. source user soft delete (refresh token revoke는 service 레이어에서 Redis로 처리)
      await tx
        .update(users)
        .set({ deletedAt: new Date(), withdrawalReason: 'merged' })
        .where(eq(users.id, sourceUserId));
    });
  }
}

import { Injectable, Inject } from '@nestjs/common';
import { eq, and, isNull, count } from 'drizzle-orm';
import { DRIZZLE, DrizzleDB } from '../database/database.module';
import { users, socialAccounts, invitations } from '../database/schema';
import type { UpdateUserDto } from './dto/update-user.dto';
import type { SocialProvider } from '../common/types/social-provider.type';

@Injectable()
export class UsersRepository {
  constructor(@Inject(DRIZZLE) private db: DrizzleDB) {}

  async findById(id: string) {
    return await this.db.query.users.findFirst({
      where: (t, { eq, isNull, and }) => and(eq(t.id, id), isNull(t.deletedAt)),
      columns: {
        id: true,
        role: true,
        email: true,
        nickname: true,
        name: true,
        birthYear: true,
        profileImageUrl: true,
        profileImageThumbnailKey: true,
      },
    });
  }

  async updateUser(id: string, data: UpdateUserDto) {
    const [updated] = await this.db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(users.id, id), isNull(users.deletedAt)))
      .returning({
        id: users.id,
        email: users.email,
        nickname: users.nickname,
        name: users.name,
        birthYear: users.birthYear,
        profileImageUrl: users.profileImageUrl,
        profileImageThumbnailKey: users.profileImageThumbnailKey,
      });
    return updated;
  }

  // 워커가 profile 섬네일 업로드 후 호출
  async updateProfileImageThumbnailKey(id: string, thumbnailKey: string): Promise<void> {
    await this.db
      .update(users)
      .set({ profileImageThumbnailKey: thumbnailKey, updatedAt: new Date() })
      .where(eq(users.id, id));
  }

  async softDeleteUser(
    id: string,
    options: { reason?: string; detail?: string } = {},
  ) {
    await this.db
      .update(users)
      .set({
        deletedAt: new Date(),
        withdrawalReason: options.reason ?? null,
        withdrawalDetail: options.detail ?? null,
      })
      .where(and(eq(users.id, id), isNull(users.deletedAt)));
  }

  // 회원 탈퇴 시 user soft delete + social 삭제 트랜잭션.
  // refresh token revoke는 service 레이어에서 Redis로 처리.
  async softDeleteUserWithCleanup(
    id: string,
    options: { reason?: string; detail?: string } = {},
  ) {
    await this.db.transaction(async (tx) => {
      await tx
        .update(users)
        .set({
          deletedAt: new Date(),
          withdrawalReason: options.reason ?? null,
          withdrawalDetail: options.detail ?? null,
        })
        .where(and(eq(users.id, id), isNull(users.deletedAt)));
      await tx.delete(socialAccounts).where(eq(socialAccounts.userId, id));
    });
  }

  async countSocialsByUserId(userId: string): Promise<number> {
    const [row] = await this.db
      .select({ count: count() })
      .from(socialAccounts)
      .where(eq(socialAccounts.userId, userId));
    return row?.count ?? 0;
  }

  // 탈퇴 차단용 — active 상태이면서 deletedAt 없는 초대장의 호스트인지 확인.
  // closed/soft-deleted 초대장은 사용자 정리 책임이 없으므로 카운트 제외.
  async countActiveHostedInvitationsByUserId(userId: string): Promise<number> {
    const [row] = await this.db
      .select({ count: count() })
      .from(invitations)
      .where(
        and(
          eq(invitations.userId, userId),
          eq(invitations.status, 'active'),
          isNull(invitations.deletedAt),
        ),
      );
    return row?.count ?? 0;
  }

  async findSocialsByUserId(userId: string) {
    return await this.db.query.socialAccounts.findMany({
      where: (t, { eq }) => eq(t.userId, userId),
      columns: {
        id: true,
        provider: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findPublicById(id: string) {
    return await this.db.query.users.findFirst({
      where: (t, { eq, isNull, and }) => and(eq(t.id, id), isNull(t.deletedAt)),
      columns: {
        id: true,
        nickname: true,
        name: true,
        profileImageUrl: true,
        profileImageThumbnailKey: true,
      },
    });
  }

  async findSocialByUserIdAndProvider(userId: string, provider: SocialProvider) {
    return await this.db.query.socialAccounts.findFirst({
      where: (t, { eq, and }) => and(eq(t.userId, userId), eq(t.provider, provider)),
      columns: { id: true },
    });
  }

  async deleteSocialAccount(id: string) {
    await this.db.delete(socialAccounts).where(eq(socialAccounts.id, id));
  }

  async deleteSocialAccountsByUserId(userId: string) {
    await this.db.delete(socialAccounts).where(eq(socialAccounts.userId, userId));
  }
}

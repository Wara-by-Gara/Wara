import { Injectable, Inject, InternalServerErrorException } from '@nestjs/common';
import { DRIZZLE, DrizzleDB } from '../database/database.module';
import { and, eq, gt, isNull } from 'drizzle-orm';
import { users, socialAccounts, refreshTokens, type NewRefreshToken } from '../database/schema';
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
          .values({ email, name, profileImageUrl })
          .returning({ id: users.id });

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

  async saveRefreshToken(
    data: Pick<
      NewRefreshToken,
      'userId' | 'tokenHash' | 'expiresAt' | 'deviceInfo' | 'ipAddress'
    >,
  ): Promise<void> {
    await this.db.insert(refreshTokens).values(data);
  }

  async findValidRefreshToken(tokenHash: string) {
    return await this.db.query.refreshTokens.findFirst({
      where: (t, { and, eq, isNull, gt }) =>
        and(
          eq(t.tokenHash, tokenHash),
          isNull(t.revokedAt),
          gt(t.expiresAt, new Date()),
        ),
    });
  }

  /**
   * 유효한 토큰을 원자적으로 무효화 (find + revoke를 단일 쿼리로 처리)
   * race condition 방지: 동시 요청이 와도 한 번만 성공
   */
  async revokeValidRefreshToken(tokenHash: string) {
    const [revoked] = await this.db
      .update(refreshTokens)
      .set({ revokedAt: new Date() })
      .where(
        and(
          eq(refreshTokens.tokenHash, tokenHash),
          isNull(refreshTokens.revokedAt),
          gt(refreshTokens.expiresAt, new Date()),
        ),
      )
      .returning();
    return revoked ?? null;
  }
    
  async findRefreshTokenByHash(tokenHash: string) {
    return await this.db.query.refreshTokens.findFirst({
      where: (t, { eq }) => eq(t.tokenHash, tokenHash),
    });
  }

  async revokeRefreshToken(
    userId: string,

    tokenHash: string,
  ): Promise<void> {
    await this.db
      .update(refreshTokens)
      .set({
        revokedAt: new Date(),
      })
      .where(
        and(
          eq(refreshTokens.userId, userId),
          eq(refreshTokens.tokenHash, tokenHash),
        ),
      );
  }

  /**
   * 사용자의 모든 Refresh Token 무효화 (전체 기기 로그아웃)
   * 해당 userId의 모든 유효한 토큰을 revoke
   */
  async revokeAllByUserId(userId: string): Promise<void> {
    await this.db
      .update(refreshTokens)
      .set({ revokedAt: new Date() })
      .where(
        and(
          eq(refreshTokens.userId, userId),
          isNull(refreshTokens.revokedAt),
        ),
      );
  }

  async findUserById(userId: string) {
    return await this.db.query.users.findFirst({
      where: (t, { eq, isNull, and }) =>
        and(eq(t.id, userId), isNull(t.deletedAt)),
    });
  }
}

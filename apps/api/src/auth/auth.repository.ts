import { Injectable, Inject, InternalServerErrorException } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { DRIZZLE, DrizzleDB } from '../database/database.module';
import { users, socialAccounts, refreshTokens, type NewRefreshToken } from '../../drizzle/schema';
import { ErrorCode } from '../common/constants/error-codes';

export interface UpsertSocialAccountParams {
  provider: 'kakao' | 'naver' | 'apple';
  providerAccountId: string;
  email?: string;
  name?: string;
}

export interface UpsertSocialAccountResult {
  userId: string;
  isNew: boolean;
}

@Injectable()
export class AuthRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async upsertSocialAccount(params: UpsertSocialAccountParams): Promise<UpsertSocialAccountResult> {
    const { provider, providerAccountId, email, name } = params;

    try {
      return await this.db.transaction(async (tx) => {
        const existingAccount = await tx
          .select({ userId: socialAccounts.userId })
          .from(socialAccounts)
          .where(
            and(
              eq(socialAccounts.provider, provider),
              eq(socialAccounts.providerAccountId, providerAccountId),
            ),
          )
          .limit(1);

        if (existingAccount.length > 0 && existingAccount[0]) {
          const userId = existingAccount[0].userId;
          await tx
            .update(users)
            .set({ lastLoginAt: new Date() })
            .where(eq(users.id, userId));
          return { userId, isNew: false };
        }

        const inserted = await tx
          .insert(users)
          .values({ email, name })
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
    data: Pick<NewRefreshToken, 'userId' | 'tokenHash' | 'expiresAt' | 'deviceInfo' | 'ipAddress'>,
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

  async findRefreshTokenByHash(tokenHash: string) {
    return await this.db.query.refreshTokens.findFirst({
      where: (t, { eq }) => eq(t.tokenHash, tokenHash),
    });
  }

  async revokeRefreshToken(userId: string, tokenHash: string): Promise<void> {
    await this.db
      .update(refreshTokens)
      .set({ revokedAt: new Date() })
      .where(
        and(
          eq(refreshTokens.userId, userId),
          eq(refreshTokens.tokenHash, tokenHash),
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

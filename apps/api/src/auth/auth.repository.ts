import { Injectable, Inject, InternalServerErrorException } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { DRIZZLE } from '../database/database.module';
import { users, socialAccounts, refreshTokens } from '../../drizzle/schema';
import type * as schema from '../../drizzle/schema';

export interface UpsertSocialAccountParams {
  provider: 'kakao' | 'naver' | 'apple';
  providerAccountId: string;
  email?: string;
  name?: string;
  profileImageUrl?: string;
}

export interface UpsertSocialAccountResult {
  userId: string;
  isNew: boolean;
}

export interface SaveRefreshTokenParams {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  deviceInfo?: string;
  ipAddress?: string;
}

@Injectable()
export class AuthRepository {
  constructor(@Inject(DRIZZLE) private db: PostgresJsDatabase<typeof schema>) {}

  /**
   * 소셜 계정이 이미 있으면 lastLoginAt 갱신 후 반환
   * 없으면 users + social_accounts 동시 생성 (트랜잭션)
   */
  async upsertSocialAccount(
    params: UpsertSocialAccountParams,
  ): Promise<UpsertSocialAccountResult> {
    const { provider, providerAccountId, email, name, profileImageUrl } = params;

    try {
      return await this.db.transaction(async (tx) => {
        const existing = await tx
          .select({ userId: socialAccounts.userId })
          .from(socialAccounts)
          .where(
            and(
              eq(socialAccounts.provider, provider),
              eq(socialAccounts.providerAccountId, providerAccountId),
            ),
          )
          .limit(1);

        if (existing.length > 0 && existing[0]) {
          const userId = existing[0].userId;
          await tx
            .update(users)
            .set({ lastLoginAt: new Date() })
            .where(eq(users.id, userId));
          return { userId, isNew: false };
        }

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
      throw new InternalServerErrorException('소셜 계정 처리 중 오류가 발생했습니다.');
    }
  }

  /**
   * refresh token 해시값을 DB에 저장
   * 평문은 저장하지 않고 sha256 해시만 보관
   */
  async saveRefreshToken(params: SaveRefreshTokenParams): Promise<void> {
    const { userId, tokenHash, expiresAt, deviceInfo, ipAddress } = params;

    try {
      await this.db.insert(refreshTokens).values({
        userId,
        tokenHash,
        expiresAt,
        deviceInfo,
        ipAddress,
      });
    } catch {
      throw new InternalServerErrorException('토큰 저장 중 오류가 발생했습니다.');
    }
  }
}

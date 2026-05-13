import { Injectable, Inject } from '@nestjs/common';
import { DRIZZLE, DrizzleDB } from '../database/database.module';
import { refreshTokens, type NewRefreshToken } from '../../drizzle/schema';
import { and, eq, isNull } from 'drizzle-orm';

@Injectable()
export class AuthRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

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

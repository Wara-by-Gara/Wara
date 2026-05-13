import { Injectable, Inject } from '@nestjs/common';
import { eq, and, isNull, gt } from 'drizzle-orm';
import { DRIZZLE } from '../database/database.module';
import * as schema from '../../drizzle/schema';

@Injectable()
export class AuthRepository {
  constructor(@Inject(DRIZZLE) private db: any) {}

  /**
   * 유효한 Refresh Token 조회
   * tokenHash로 조회 + revokedAt IS NULL (유효함) + expiresAt > now (만료 안 됨)
   */
  async findValidByTokenHash(tokenHash: string) {
    const result = await this.db
      .select()
      .from(schema.refreshTokens)
      .where(
        and(
          eq(schema.refreshTokens.tokenHash, tokenHash),
          isNull(schema.refreshTokens.revokedAt),
          gt(schema.refreshTokens.expiresAt, new Date()),
        ),
      )
      .limit(1);

    return result[0] ?? null;
  }

  /**
   * Refresh Token 무효화 (soft delete)
   * revokedAt을 현재 시간으로 설정
   */
  async revokeByTokenHash(tokenHash: string) {
    await this.db
      .update(schema.refreshTokens)
      .set({ revokedAt: new Date() })
      .where(eq(schema.refreshTokens.tokenHash, tokenHash));
  }

  /**
   * 사용자의 모든 Refresh Token 무효화 (전체 기기 로그아웃)
   * 해당 userId의 모든 유효한 토큰을 revoke
   */
  async revokeAllByUserId(userId: string) {
    await this.db
      .update(schema.refreshTokens)
      .set({ revokedAt: new Date() })
      .where(
        and(
          eq(schema.refreshTokens.userId, userId),
          isNull(schema.refreshTokens.revokedAt),
        ),
      );
  }

  /**
   * 새 Refresh Token 저장
   * tokenHash (해시된 토큰), expiresAt, 선택사항 deviceInfo/ipAddress
   */
  async createRefreshToken(data: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
    deviceInfo?: string;
    ipAddress?: string;
  }) {
    const result = await this.db
      .insert(schema.refreshTokens)
      .values(data)
      .returning();

    return result[0];
  }

  /**
   * Refresh Token 사용 기록 업데이트
   * lastUsedAt을 현재 시간으로 설정
   */
  async updateLastUsedAt(tokenHash: string) {
    await this.db
      .update(schema.refreshTokens)
      .set({ lastUsedAt: new Date() })
      .where(eq(schema.refreshTokens.tokenHash, tokenHash));
  }
}

import { Injectable, Inject } from '@nestjs/common';
import { DRIZZLE, DrizzleDB } from '../database/database.module';
import { refreshTokens } from '../../drizzle/schema';
import { and, eq } from 'drizzle-orm';

@Injectable()
export class AuthRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async saveRefreshToken(data: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
  }): Promise<void> {
    await this.db.insert(refreshTokens).values(data);
  }

  async findValidRefreshToken( tokenHash: string) {
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

  async findUserById(userId: string) {
    return await this.db.query.users.findFirst({
      where: (t, { eq }) => eq(t.id, userId),
    });
  }
}

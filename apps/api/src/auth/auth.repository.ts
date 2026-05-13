import { Injectable, Inject, InternalServerErrorException } from '@nestjs/common';
import { and, eq, isNull } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { ulid } from 'ulid';
import { DRIZZLE } from '../database/database.module';
import * as schema from '../../drizzle/schema';
import { users, socialAccounts } from '../../drizzle/schema/users';

interface SocialUpsertParams {
  provider: 'kakao' | 'naver' | 'apple';
  providerAccountId: string;
  email?: string;
  name?: string;
  profileImageUrl?: string;
  rawProfile: unknown;
}

@Injectable()
export class AuthRepository {
  constructor(@Inject(DRIZZLE) private readonly db: PostgresJsDatabase<typeof schema>) {}

  async upsertUserBySocial(params: SocialUpsertParams): Promise<{ id: string; role: string }> {
    const { provider, providerAccountId, email, name, profileImageUrl, rawProfile } = params;

    const [existing] = await this.db
      .select({ userId: socialAccounts.userId })
      .from(socialAccounts)
      .where(
        and(
          eq(socialAccounts.provider, provider),
          eq(socialAccounts.providerAccountId, providerAccountId),
        ),
      )
      .limit(1);

    if (existing) {
      const rows = await this.db
        .update(users)
        .set({ lastLoginAt: new Date() })
        .where(eq(users.id, existing.userId))
        .returning({ id: users.id, role: users.role });

      const user = rows[0];
      if (!user) throw new InternalServerErrorException();
      return user;
    }

    return this.db.transaction(async (tx) => {
      const inserted = await tx
        .insert(users)
        .values({ id: ulid(), email, name, profileImageUrl, lastLoginAt: new Date() })
        .returning({ id: users.id, role: users.role });

      const newUser = inserted[0];
      if (!newUser) throw new InternalServerErrorException();

      await tx.insert(socialAccounts).values({
        id: ulid(),
        userId: newUser.id,
        provider,
        providerAccountId,
        rawProfile,
      });

      return newUser;
    });
  }

  async saveRefreshToken(userId: string, hashedToken: string): Promise<void> {
    await this.db
      .update(users)
      .set({ refreshToken: hashedToken })
      .where(eq(users.id, userId));
  }

  async findUserById(userId: string): Promise<typeof users.$inferSelect | null> {
    const [user] = await this.db
      .select()
      .from(users)
      .where(and(eq(users.id, userId), isNull(users.deletedAt)))
      .limit(1);
    return user ?? null;
  }
}

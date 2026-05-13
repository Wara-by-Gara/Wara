import { Injectable, Inject, InternalServerErrorException } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DRIZZLE } from '../database/database.module';
import { users, socialAccounts } from '../../drizzle/schema';
import type * as schema from '../../drizzle/schema';

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
  constructor(@Inject(DRIZZLE) private db: NodePgDatabase<typeof schema>) {}

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
      throw new InternalServerErrorException('소셜 계정 처리 중 오류가 발생했습니다.');
    }
  }
}

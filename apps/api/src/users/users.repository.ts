import { Injectable, Inject } from '@nestjs/common';
import { eq, and, isNull } from 'drizzle-orm';
import { DRIZZLE, DrizzleDB } from '../database/database.module';
import { users, socialAccounts } from '../database/schema';
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
        email: true,
        nickname: true,
        name: true,
        birthYear: true,
        profileImageUrl: true,
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
      });
    return updated;
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

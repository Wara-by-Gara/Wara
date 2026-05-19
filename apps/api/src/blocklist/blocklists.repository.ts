import { Injectable, Inject } from '@nestjs/common';
import { and, eq, isNull } from 'drizzle-orm';
import { DRIZZLE, DrizzleDB } from '../database/database.module';
import { invitationBlocklists, users } from '../../drizzle/schema';

@Injectable()
export class BlocklistsRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async findByInvitation(invitationId: string) {
    return this.db
      .select({
        userId: users.id,
        nickname: users.nickname,
        profileImageUrl: users.profileImageUrl,
        blockedAt: invitationBlocklists.createdAt,
      })
      .from(invitationBlocklists)
      .innerJoin(users, eq(invitationBlocklists.blockedUserId, users.id))
      .where(
        and(eq(invitationBlocklists.invitationId, invitationId), isNull(invitationBlocklists.deletedAt)),
      );
  }

  async remove(invitationId: string, blockedUserId: string): Promise<void> {
    await this.db
      .update(invitationBlocklists)
      .set({ deletedAt: new Date() })
      .where(
        and(
          eq(invitationBlocklists.invitationId, invitationId),
          eq(invitationBlocklists.blockedUserId, blockedUserId),
          isNull(invitationBlocklists.deletedAt),
        ),
      );
  }
}

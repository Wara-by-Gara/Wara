import { Injectable, Inject } from '@nestjs/common';
import { DRIZZLE, DrizzleDB } from '../../database/database.module';
import { invitationBlocklists } from '../../../drizzle/schema';

@Injectable()
export class BlocklistRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async isBlocked(userId: string, invitationId: string): Promise<boolean> {
    const row = await this.db.query.invitationBlocklists.findFirst({
      where: (b, { and, eq, isNull }) =>
        and(eq(b.invitationId, invitationId), eq(b.blockedUserId, userId), isNull(b.deletedAt)),
    });
    return !!row;
  }

  async add(invitationId: string, blockedUserId: string, blockedByUserId: string): Promise<void> {
    await this.db
      .insert(invitationBlocklists)
      .values({ invitationId, blockedUserId, blockedByUserId })
      .onConflictDoNothing();
  }
}

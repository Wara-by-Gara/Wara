import { Injectable, Inject } from '@nestjs/common';
import { and, eq, isNull } from 'drizzle-orm';
import { invitationSendLogs, invitations, participants } from '../database/schema';
import type { InvitationSendLog } from '../database/schema';
import { DRIZZLE, DrizzleDB } from '../database/database.module';

@Injectable()
export class SendLogsRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async create(data: {
    invitationId: string;
    senderId: string;
    channel: InvitationSendLog['channel'];
    inviteUrl: string;
  }) {
    const [row] = await this.db
      .insert(invitationSendLogs)
      .values(data)
      .returning();
    return row!;
  }

  async findById(logId: string) {
    const [row] = await this.db
      .select()
      .from(invitationSendLogs)
      .where(eq(invitationSendLogs.id, logId))
      .limit(1);
    return row ?? null;
  }

  async canShare(invitationId: string, userId: string): Promise<boolean> {
    const [row] = await this.db
      .select({
        isPublic: invitations.isPublic,
        participantId: participants.id,
      })
      .from(invitations)
      .leftJoin(
        participants,
        and(
          eq(participants.invitationId, invitations.id),
          eq(participants.userId, userId),
        ),
      )
      .where(and(eq(invitations.id, invitationId), isNull(invitations.deletedAt)))
      .limit(1);

    if (!row) return false;
    return row.isPublic || !!row.participantId;
  }

}

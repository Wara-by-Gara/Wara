import { Injectable, Inject } from '@nestjs/common';
import { DRIZZLE, DrizzleDB } from '../database/database.module';
import { eq, and, or, isNull, isNotNull, inArray, sql } from 'drizzle-orm';
import { invitations, participants } from '../database/schema';
import { remindLogs } from '../database/schema';

export type RemindType = 'D+7' | 'D+30' | 'D+365';

const DATE_CONDITIONS = {
  'D+7': sql`DATE(${invitations.eventStartAt} AT TIME ZONE 'Asia/Seoul') = DATE((NOW() - INTERVAL '7 days') AT TIME ZONE 'Asia/Seoul')`,
  'D+30': sql`DATE(${invitations.eventStartAt} AT TIME ZONE 'Asia/Seoul') = DATE((NOW() - INTERVAL '30 days') AT TIME ZONE 'Asia/Seoul')`,
  'D+365': sql`DATE(${invitations.eventStartAt} AT TIME ZONE 'Asia/Seoul') = DATE((NOW() - INTERVAL '365 days') AT TIME ZONE 'Asia/Seoul')`,
} as const;

@Injectable()
export class RemindSchedulerRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async findRemindTargets(remindType: RemindType) {
    const targetInvitations = await this.db
      .select({ id: invitations.id, title: invitations.title })
      .from(invitations)
      .leftJoin(
        remindLogs,
        and(
          eq(remindLogs.invitationId, invitations.id),
          eq(remindLogs.remindType, remindType),
        ),
      )
      .where(
        and(
          isNull(invitations.deletedAt),
          eq(invitations.status, 'active'),
          isNotNull(invitations.eventStartAt),
          DATE_CONDITIONS[remindType],
          isNull(remindLogs.id),
        ),
      );

    if (targetInvitations.length === 0) return [];

    const invitationIds = targetInvitations.map((i) => i.id);

    const allParticipants = await this.db
      .select({ userId: participants.userId, invitationId: participants.invitationId })
      .from(participants)
      .where(
        and(
          inArray(participants.invitationId, invitationIds),
          or(
            eq(participants.memberRole, 'HOST'),
            inArray(participants.rsvpStatus, ['attending', 'undecided']),
          ),
        ),
      );

    const participantsByInvitation = new Map<string, { userId: string }[]>();
    for (const p of allParticipants) {
      const list = participantsByInvitation.get(p.invitationId) ?? [];
      list.push({ userId: p.userId });
      participantsByInvitation.set(p.invitationId, list);
    }

    return targetInvitations.map((invitation) => ({
      invitation,
      participants: participantsByInvitation.get(invitation.id) ?? [],
    }));
  }

  async markAsSent(invitationId: string, remindType: RemindType) {
    await this.db
      .insert(remindLogs)
      .values({ invitationId, remindType })
      .onConflictDoNothing();
  }

  async markAsSentBatch(invitationIds: string[], remindType: RemindType) {
    if (invitationIds.length === 0) return;
    await this.db
      .insert(remindLogs)
      .values(invitationIds.map((invitationId) => ({ invitationId, remindType })))
      .onConflictDoNothing();
  }
}

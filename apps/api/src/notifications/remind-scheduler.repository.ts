import { Injectable, Inject } from '@nestjs/common';
import { DRIZZLE, DrizzleDB } from '../database/database.module';
import { eq, and, or, isNull, isNotNull, inArray, sql } from 'drizzle-orm';
import { invitations, participants } from '../database/schema';
import { remindLogs } from '../database/schema';

export type RemindType = 'D-7' | 'D-30' | 'D+365';

const DATE_CONDITIONS = {
  'D-7': sql`DATE(${invitations.eventStartAt} AT TIME ZONE 'Asia/Seoul') = DATE((NOW() + INTERVAL '7 days') AT TIME ZONE 'Asia/Seoul')`,
  'D-30': sql`DATE(${invitations.eventStartAt} AT TIME ZONE 'Asia/Seoul') = DATE((NOW() + INTERVAL '30 days') AT TIME ZONE 'Asia/Seoul')`,
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

    return Promise.all(
      targetInvitations.map(async (invitation) => {
        const invitationParticipants = await this.db
          .select({ userId: participants.userId })
          .from(participants)
          .where(
            and(
              eq(participants.invitationId, invitation.id),
              or(
                eq(participants.memberRole, 'HOST'),
                inArray(participants.rsvpStatus, ['attending', 'undecided']),
              ),
            ),
          );
        return { invitation, participants: invitationParticipants };
      }),
    );
  }

  async markAsSent(invitationId: string, remindType: RemindType) {
    await this.db
      .insert(remindLogs)
      .values({ invitationId, remindType })
      .onConflictDoNothing();
  }
}

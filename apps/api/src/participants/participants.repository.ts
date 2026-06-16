import { Injectable, Inject } from '@nestjs/common';
import { and, eq, isNull } from 'drizzle-orm';
import {
  invitations,
  invitationBlocklists,
  participants,
  users,
  rsvpStatusEnum,
  type Participant,
} from '../database/schema';
import { DRIZZLE, DrizzleDB } from '../database/database.module';

type RsvpStatus = (typeof rsvpStatusEnum.enumValues)[number];

@Injectable()
export class ParticipantsRepository {
  constructor(@Inject(DRIZZLE) private db: DrizzleDB) {}

  async findAllByInvitation(invitationId: string) {
    return this.db
      .select({ participant: participants, user: users })
      .from(participants)
      .innerJoin(users, eq(participants.userId, users.id))
      .where(
        and(
          eq(participants.invitationId, invitationId),
          isNull(users.deletedAt),
        ),
      );
  }

  /** 호스트 권한 이전 — 기존 호스트→GUEST, 대상→HOST, invitation.userId 갱신 (한 트랜잭션) */
  async transferHost(
    invitationId: string,
    fromParticipantId: string,
    toParticipantId: string,
    toUserId: string,
  ): Promise<void> {
    await this.db.transaction(async (tx) => {
      await tx
        .update(participants)
        .set({ memberRole: 'GUEST', updatedAt: new Date() })
        .where(eq(participants.id, fromParticipantId));
      await tx
        .update(participants)
        .set({ memberRole: 'HOST', updatedAt: new Date() })
        .where(eq(participants.id, toParticipantId));
      await tx
        .update(invitations)
        .set({ userId: toUserId, updatedAt: new Date() })
        .where(eq(invitations.id, invitationId));
    });
  }

  async findById(id: string): Promise<Participant | null> {
    const rows = await this.db
      .select()
      .from(participants)
      .where(eq(participants.id, id))
      .limit(1);
    return rows[0] ?? null;
  }

  async findByUserAndInvitation(
    userId: string,
    invitationId: string,
  ): Promise<Participant | null> {
    const rows = await this.db
      .select()
      .from(participants)
      .where(
        and(
          eq(participants.userId, userId),
          eq(participants.invitationId, invitationId),
        ),
      )
      .limit(1);
    return rows[0] ?? null;
  }

  async findInvitationInfo(
    invitationId: string,
  ): Promise<{ status: 'active' | 'closed'; eventStartAt: Date | null; rsvpDeadlineAt: Date | null; hostUserId: string } | null> {
    const rows = await this.db
      .select({
        status: invitations.status,
        eventStartAt: invitations.eventStartAt,
        rsvpDeadlineAt: invitations.rsvpDeadlineAt,
        hostUserId: invitations.userId,
      })
      .from(invitations)
      .where(eq(invitations.id, invitationId))
      .limit(1);
    return rows[0] ?? null;
  }

  async findUserNickname(userId: string): Promise<string | null> {
    const rows = await this.db
      .select({ name: users.name })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    return rows[0]?.name ?? null;
  }

  async create(data: {
    userId: string;
    invitationId: string;
    rsvpStatus: RsvpStatus;
    note?: string;
  }): Promise<Participant> {
    const rows = await this.db
      .insert(participants)
      .values({ ...data, memberRole: 'GUEST' })
      .returning();
    return rows[0]!;
  }

  async updateRsvpStatus(
    id: string,
    rsvpStatus: RsvpStatus,
  ): Promise<Participant | null> {
    const rows = await this.db
      .update(participants)
      .set({ rsvpStatus, updatedAt: new Date() })
      .where(eq(participants.id, id))
      .returning();
    return rows[0] ?? null;
  }

  /** 공동 호스트 지정/해제 — memberRole 단순 변경 */
  async setMemberRole(
    id: string,
    memberRole: 'HOST' | 'GUEST',
  ): Promise<Participant | null> {
    const rows = await this.db
      .update(participants)
      .set({ memberRole, updatedAt: new Date() })
      .where(eq(participants.id, id))
      .returning();
    return rows[0] ?? null;
  }

  async updateHidden(
    id: string,
    isHidden: boolean,
  ): Promise<Participant | null> {
    const rows = await this.db
      .update(participants)
      .set({ isHidden, updatedAt: new Date() })
      .where(eq(participants.id, id))
      .returning();
    return rows[0] ?? null;
  }

  async updateHostMemo(id: string, hostMemo: string | null): Promise<Participant | null> {
    const rows = await this.db
      .update(participants)
      .set({ hostMemo, updatedAt: new Date() })
      .where(eq(participants.id, id))
      .returning();
    return rows[0] ?? null;
  }

  async hardDelete(id: string): Promise<void> {
    await this.db.delete(participants).where(eq(participants.id, id));
  }

  async kickAndBlock(
    participantId: string,
    invitationId: string,
    blockedUserId: string,
    blockedByUserId: string,
  ): Promise<void> {
    await this.db.transaction(async (tx) => {
      await tx.delete(participants).where(eq(participants.id, participantId));
      await tx
        .insert(invitationBlocklists)
        .values({ invitationId, blockedUserId, blockedByUserId })
        .onConflictDoNothing();
    });
  }
}

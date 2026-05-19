import { Injectable, Inject } from '@nestjs/common';
import { and, eq, inArray, isNull, ne, notInArray } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import {
  invitations,
  participants,
  users,
  rsvpStatusEnum,
  type Invitation,
  type Participant,
  type User,
} from '../../drizzle/schema';
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

  async findById(id: string): Promise<Participant | null> {
    const rows = await this.db
      .select()
      .from(participants)
      .where(eq(participants.id, id))
      .limit(1);
    return rows[0] ?? null;
  }

  async findByIdWithUser(
    id: string,
  ): Promise<{ participant: Participant; user: User } | null> {
    const rows = await this.db
      .select({ participant: participants, user: users })
      .from(participants)
      .innerJoin(users, eq(participants.userId, users.id))
      .where(and(eq(participants.id, id), isNull(users.deletedAt)))
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

  async findInvitationStatus(
    invitationId: string,
  ): Promise<'active' | 'closed' | null> {
    const rows = await this.db
      .select({ status: invitations.status })
      .from(invitations)
      .where(eq(invitations.id, invitationId))
      .limit(1);
    return rows[0]?.status ?? null;
  }

  async getMutualParticipants(myUserId: string, targetUserId: string) {
    const p1 = alias(participants, 'p1');
    const p2 = alias(participants, 'p2');

    const sharedRows = await this.db
      .selectDistinct({ invitationId: p1.invitationId })
      .from(p1)
      .innerJoin(p2, eq(p1.invitationId, p2.invitationId))
      .where(and(eq(p1.userId, myUserId), eq(p2.userId, targetUserId)));

    if (sharedRows.length === 0) return [];

    const sharedIds = sharedRows.map((r) => r.invitationId);
    return this.db
      .select({ participant: participants, user: users })
      .from(participants)
      .innerJoin(users, eq(participants.userId, users.id))
      .where(
        and(
          inArray(participants.invitationId, sharedIds),
          notInArray(participants.userId, [myUserId, targetUserId]),
          isNull(users.deletedAt),
        ),
      );
  }

  async getSharedInvitations(
    myUserId: string,
    targetUserId: string,
    excludeInvitationId: string,
  ): Promise<Invitation[]> {
    const p1 = alias(participants, 'p1');
    const p2 = alias(participants, 'p2');

    const rows = await this.db
      .select({ invitation: invitations })
      .from(invitations)
      .innerJoin(
        p1,
        and(eq(p1.invitationId, invitations.id), eq(p1.userId, myUserId)),
      )
      .innerJoin(
        p2,
        and(eq(p2.invitationId, invitations.id), eq(p2.userId, targetUserId)),
      )
      .where(ne(invitations.id, excludeInvitationId));
    return rows.map((r) => r.invitation);
  }

  async create(data: {
    userId: string;
    invitationId: string;
    rsvpStatus: RsvpStatus;
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

  async hardDelete(id: string): Promise<void> {
    await this.db.delete(participants).where(eq(participants.id, id));
  }
}

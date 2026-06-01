import { Injectable, Inject } from '@nestjs/common';
import { DRIZZLE, DrizzleDB } from '../database/database.module';
import { and, eq, isNull } from 'drizzle-orm';
import { eventLocations, participantLocations } from '../database/schema';
import type { SetEventLocationDto } from './dto/set-event-location.dto';
import type { UpdateParticipantLocationDto } from './dto/update-participant-location.dto';

@Injectable()
export class LocationsRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async findEventLocation(invitationId: string) {
    return this.db.query.eventLocations.findFirst({
      where: (t, { eq, and, isNull }) =>
        and(eq(t.invitationId, invitationId), isNull(t.deletedAt)),
    });
  }

  async upsertEventLocation(invitationId: string, dto: SetEventLocationDto) {
    const [result] = await this.db
      .insert(eventLocations)
      .values({ invitationId, ...dto })
      .onConflictDoUpdate({
        target: eventLocations.invitationId,
        set: { ...dto, deletedAt: null, updatedAt: new Date() },
      })
      .returning();
    return result!;
  }

  async deleteEventLocation(invitationId: string) {
    await this.db
      .update(eventLocations)
      .set({ deletedAt: new Date() })
      .where(
        and(
          eq(eventLocations.invitationId, invitationId),
          isNull(eventLocations.deletedAt),
        ),
      );
  }

  async findParticipantById(id: string, invitationId: string) {
    return this.db.query.participants.findFirst({
      where: (t, { eq, and }) =>
        and(eq(t.id, id), eq(t.invitationId, invitationId)),
    });
  }

  async findParticipant(userId: string, invitationId: string) {
    return this.db.query.participants.findFirst({
      where: (t, { eq, and }) =>
        and(eq(t.userId, userId), eq(t.invitationId, invitationId)),
    });
  }

  async findParticipantWithUser(userId: string, invitationId: string) {
    return this.db.query.participants.findFirst({
      where: (t, { eq, and }) =>
        and(eq(t.userId, userId), eq(t.invitationId, invitationId)),
      with: { user: true },
    });
  }

  async findHostByInvitation(invitationId: string) {
    return this.db.query.participants.findFirst({
      where: (t, { eq, and }) =>
        and(eq(t.invitationId, invitationId), eq(t.memberRole, 'HOST')),
    });
  }

  async setArrivedIfNotYet(participantId: string, invitationId: string): Promise<boolean> {
    const result = await this.db
      .update(participantLocations)
      .set({ isArrived: true, updatedAt: new Date() })
      .where(
        and(
          eq(participantLocations.participantId, participantId),
          eq(participantLocations.invitationId, invitationId),
          eq(participantLocations.isArrived, false),
        ),
      )
      .returning({ id: participantLocations.id });
    return result.length > 0;
  }

  async findAllParticipantLocations(invitationId: string) {
    return this.db.query.participantLocations.findMany({
      where: (t, { eq }) => eq(t.invitationId, invitationId),
    });
  }

  async upsertParticipantLocation(
    invitationId: string,
    participantId: string,
    dto: UpdateParticipantLocationDto,
  ) {
    const [result] = await this.db
      .insert(participantLocations)
      .values({ invitationId, participantId, ...dto })
      .onConflictDoUpdate({
        target: [
          participantLocations.invitationId,
          participantLocations.participantId,
        ],
        set: { ...dto, updatedAt: new Date() },
      })
      .returning();
    return result!;
  }
}

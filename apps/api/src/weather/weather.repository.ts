import { Injectable, Inject } from '@nestjs/common';
import { isNull, eq, and } from 'drizzle-orm';
import { DRIZZLE, DrizzleDB } from '../database/database.module';
import { invitations } from '../database/schema/invitations';
import { eventLocations } from '../database/schema/locations';

export interface InvitationWithLocation {
  eventStartAt: Date | null;
  eventLocation: { lat: number; lng: number } | null;
}

@Injectable()
export class WeatherRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async findInvitationWithLocation(invitationId: string): Promise<InvitationWithLocation | null> {
    const rows = await this.db
      .select({
        eventStartAt: invitations.eventStartAt,
        lat: eventLocations.lat,
        lng: eventLocations.lng,
      })
      .from(invitations)
      .leftJoin(eventLocations, eq(eventLocations.invitationId, invitations.id))
      .where(and(eq(invitations.id, invitationId), isNull(invitations.deletedAt)))
      .limit(1);

    const row = rows[0];
    if (!row) return null;

    return {
      eventStartAt: row.eventStartAt,
      eventLocation: row.lat != null && row.lng != null ? { lat: row.lat, lng: row.lng } : null,
    };
  }
}

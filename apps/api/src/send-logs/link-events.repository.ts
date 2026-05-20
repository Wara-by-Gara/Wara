import { Injectable, Inject } from '@nestjs/common';
import { invitationLinkEvents } from '../database/schema';
import type { InvitationLinkEvent } from '../database/schema';
import { DRIZZLE, DrizzleDB } from '../database/database.module';

@Injectable()
export class LinkEventsRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async createEvent(data: {
    logId: string;
    eventType: InvitationLinkEvent['eventType'];
    userId?: string | null;
  }) {
    const [row] = await this.db
      .insert(invitationLinkEvents)
      .values(data)
      .returning();
    return row!;
  }
}

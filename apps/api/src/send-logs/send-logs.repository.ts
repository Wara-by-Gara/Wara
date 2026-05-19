import { Injectable, Inject } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { invitationSendLogs } from '../../drizzle/schema';
import type { InvitationSendLog } from '../../drizzle/schema';
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

}

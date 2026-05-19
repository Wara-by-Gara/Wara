import {
  participants,
  eventLocations,
  invitationSendLogs,
  invitationLinkEvents,
  invitationBlocklists,
  notifications,
} from '../schema';
import type { DrizzleDB } from '../../src/database/database.module';
import { SEEDS } from './fixtures';

export async function seedTier3(db: DrizzleDB) {
  await db.insert(participants).values(SEEDS.participants).onConflictDoNothing();
  await db.insert(eventLocations).values(SEEDS.eventLocations).onConflictDoNothing();
  await db.insert(invitationSendLogs).values(SEEDS.sendLogs).onConflictDoNothing();
  await db.insert(invitationLinkEvents).values(SEEDS.linkEvents).onConflictDoNothing();
  await db.insert(invitationBlocklists).values(SEEDS.blocklists).onConflictDoNothing();
  await db.insert(notifications).values(SEEDS.notifications).onConflictDoNothing();
}

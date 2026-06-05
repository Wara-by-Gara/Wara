import {
  participants,
  eventLocations,
  invitationSendLogs,
  invitationLinkEvents,
  invitationBlocklists,
  notifications,
} from '../../src/database/schema';
import type { DrizzleDB } from '../../src/database/database.module';
import { SEEDS } from './fixtures';
import { chunkedInsert } from './util';

export async function seedTier3(db: DrizzleDB) {
  await chunkedInsert(
    (chunk) => db.insert(participants).values(chunk).onConflictDoNothing(),
    SEEDS.participants,
  );
  await chunkedInsert(
    (chunk) => db.insert(eventLocations).values(chunk).onConflictDoNothing(),
    SEEDS.eventLocations,
  );
  await chunkedInsert(
    (chunk) => db.insert(invitationSendLogs).values(chunk).onConflictDoNothing(),
    SEEDS.sendLogs,
  );
  await chunkedInsert(
    (chunk) => db.insert(invitationLinkEvents).values(chunk).onConflictDoNothing(),
    SEEDS.invitationLinkEvents,
  );
  await chunkedInsert(
    (chunk) => db.insert(invitationBlocklists).values(chunk).onConflictDoNothing(),
    SEEDS.blocklists,
  );
  await chunkedInsert(
    (chunk) => db.insert(notifications).values(chunk).onConflictDoNothing(),
    SEEDS.notifications,
  );
}

import {
  faqItems,
  userTermAgreements,
  remindLogs,
  aiImageJobs,
  dateVotePolls,
  dateVoteSlots,
  dateVoteResponses,
} from '../../src/database/schema';
import type { DrizzleDB } from '../../src/database/database.module';
import { SEEDS } from './fixtures';
import { chunkedInsert } from './util';

export async function seedTier6(db: DrizzleDB) {
  await db.insert(faqItems).values(SEEDS.faqItems).onConflictDoNothing();
  await chunkedInsert(
    (chunk) => db.insert(userTermAgreements).values(chunk).onConflictDoNothing(),
    SEEDS.userTermAgreements,
  );
  await chunkedInsert(
    (chunk) => db.insert(remindLogs).values(chunk).onConflictDoNothing(),
    SEEDS.remindLogs,
  );
  await chunkedInsert(
    (chunk) => db.insert(aiImageJobs).values(chunk).onConflictDoNothing(),
    SEEDS.aiImageJobs,
  );
  // date_vote: polls → slots → responses 순서 (FK 의존)
  await chunkedInsert(
    (chunk) => db.insert(dateVotePolls).values(chunk).onConflictDoNothing(),
    SEEDS.dateVotePolls,
  );
  await chunkedInsert(
    (chunk) => db.insert(dateVoteSlots).values(chunk).onConflictDoNothing(),
    SEEDS.dateVoteSlots,
  );
  await chunkedInsert(
    (chunk) => db.insert(dateVoteResponses).values(chunk).onConflictDoNothing(),
    SEEDS.dateVoteResponses,
  );
}

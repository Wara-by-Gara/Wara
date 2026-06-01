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

export async function seedTier6(db: DrizzleDB) {
  await db.insert(faqItems).values(SEEDS.faqItems).onConflictDoNothing();
  await db.insert(userTermAgreements).values(SEEDS.userTermAgreements).onConflictDoNothing();
  await db.insert(remindLogs).values(SEEDS.remindLogs).onConflictDoNothing();
  await db.insert(aiImageJobs).values(SEEDS.aiImageJobs).onConflictDoNothing();
  // date_vote: polls → slots → responses 순서 (FK 의존)
  await db.insert(dateVotePolls).values(SEEDS.dateVotePolls).onConflictDoNothing();
  await db.insert(dateVoteSlots).values(SEEDS.dateVoteSlots).onConflictDoNothing();
  await db.insert(dateVoteResponses).values(SEEDS.dateVoteResponses).onConflictDoNothing();
}

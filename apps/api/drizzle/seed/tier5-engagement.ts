import { photoLikes, feedbacks, feedbackLikes } from '../../src/database/schema';
import type { DrizzleDB } from '../../src/database/database.module';
import { SEEDS } from './fixtures';
import { chunkedInsert } from './util';

export async function seedTier5(db: DrizzleDB) {
  await chunkedInsert(
    (chunk) => db.insert(photoLikes).values(chunk).onConflictDoNothing(),
    SEEDS.photoLikes,
  );

  // feedbacks의 self-referential FK 처리:
  // parent_id = null 인 피드백을 먼저 insert, 이후 reply(parent_id 있는 것) insert
  const rootFeedbacks = SEEDS.feedbacks.filter((f) => f.parentId === null);
  const replyFeedbacks = SEEDS.feedbacks.filter((f) => f.parentId !== null);

  await chunkedInsert(
    (chunk) => db.insert(feedbacks).values(chunk).onConflictDoNothing(),
    rootFeedbacks,
  );
  await chunkedInsert(
    (chunk) => db.insert(feedbacks).values(chunk).onConflictDoNothing(),
    replyFeedbacks,
  );

  await chunkedInsert(
    (chunk) => db.insert(feedbackLikes).values(chunk).onConflictDoNothing(),
    SEEDS.feedbackLikes,
  );
}

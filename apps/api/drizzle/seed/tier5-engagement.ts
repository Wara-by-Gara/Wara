import { photoLikes, feedbacks, feedbackLikes } from '../../src/database/schema';
import type { DrizzleDB } from '../../src/database/database.module';
import { SEEDS } from './fixtures';

export async function seedTier5(db: DrizzleDB) {
  await db.insert(photoLikes).values(SEEDS.photoLikes).onConflictDoNothing();

  // feedbacks의 self-referential FK 처리:
  // parent_id = null 인 피드백을 먼저 insert, 이후 reply(parent_id 있는 것) insert
  const rootFeedbacks = SEEDS.feedbacks.filter((f) => f.parentId === null);
  const replyFeedbacks = SEEDS.feedbacks.filter((f) => f.parentId !== null);

  if (rootFeedbacks.length > 0) {
    await db.insert(feedbacks).values(rootFeedbacks).onConflictDoNothing();
  }
  if (replyFeedbacks.length > 0) {
    await db.insert(feedbacks).values(replyFeedbacks).onConflictDoNothing();
  }

  await db.insert(feedbackLikes).values(SEEDS.feedbackLikes).onConflictDoNothing();
}

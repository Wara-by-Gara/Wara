import { socialAccounts, notificationSettings, inquiries } from '../../src/database/schema';
import type { DrizzleDB } from '../../src/database/database.module';
import { SEEDS } from './fixtures';
import { chunkedInsert } from './util';

export async function seedTier1(db: DrizzleDB) {
  await chunkedInsert(
    (chunk) => db.insert(socialAccounts).values(chunk).onConflictDoNothing(),
    SEEDS.socialAccounts,
  );
  await chunkedInsert(
    (chunk) => db.insert(notificationSettings).values(chunk).onConflictDoNothing(),
    SEEDS.notificationSettings,
  );
  await db.insert(inquiries).values(SEEDS.inquiries).onConflictDoNothing();
}

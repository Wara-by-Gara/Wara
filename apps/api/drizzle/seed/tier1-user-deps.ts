import { socialAccounts, notificationSettings } from '../schema';
import type { DrizzleDB } from '../../src/database/database.module';
import { SEEDS } from './fixtures';

export async function seedTier1(db: DrizzleDB) {
  await db.insert(socialAccounts).values(SEEDS.socialAccounts).onConflictDoNothing();
  await db.insert(notificationSettings).values(SEEDS.notificationSettings).onConflictDoNothing();
}

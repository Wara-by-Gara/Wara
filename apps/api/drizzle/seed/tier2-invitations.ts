import { invitations } from '../../src/database/schema';
import type { DrizzleDB } from '../../src/database/database.module';
import { SEEDS } from './fixtures';

export async function seedTier2(db: DrizzleDB) {
  await db.insert(invitations).values(SEEDS.invitations).onConflictDoNothing();
}

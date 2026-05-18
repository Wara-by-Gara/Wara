import { invitationTemplates, users } from '../schema';
import type { DrizzleDB } from '../../src/database/database.module';
import { SEEDS } from './fixtures';

export async function seedTier0(db: DrizzleDB) {
  await db.insert(invitationTemplates).values(SEEDS.templates).onConflictDoNothing();
  await db.insert(users).values(SEEDS.users).onConflictDoNothing();
}

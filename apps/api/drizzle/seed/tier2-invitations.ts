import { invitations } from '../../src/database/schema';
import type { DrizzleDB } from '../../src/database/database.module';
import { SEEDS } from './fixtures';
import { chunkedInsert } from './util';

export async function seedTier2(db: DrizzleDB) {
  await chunkedInsert(
    (chunk) => db.insert(invitations).values(chunk).onConflictDoNothing(),
    SEEDS.invitations,
  );
}

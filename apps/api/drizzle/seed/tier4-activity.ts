import { participantLocations, missions, missionAssignments, photos } from '../schema';
import type { DrizzleDB } from '../../src/database/database.module';
import { SEEDS } from './fixtures';

export async function seedTier4(db: DrizzleDB) {
  await db.insert(participantLocations).values(SEEDS.participantLocations).onConflictDoNothing();
  await db.insert(missions).values(SEEDS.missions).onConflictDoNothing();
  await db.insert(missionAssignments).values(SEEDS.missionAssignments).onConflictDoNothing();
  await db.insert(photos).values(SEEDS.photos).onConflictDoNothing();
}

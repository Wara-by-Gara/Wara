import { sql } from 'drizzle-orm';
import { participantLocations, missions, missionAssignments, photos } from '../../src/database/schema';
import type { DrizzleDB } from '../../src/database/database.module';
import { SEEDS } from './fixtures';
import { chunkedInsert } from './util';

export async function seedTier4(db: DrizzleDB) {
  await chunkedInsert(
    (chunk) => db.insert(participantLocations).values(chunk).onConflictDoNothing(),
    SEEDS.participantLocations,
  );
  await chunkedInsert(
    (chunk) => db.insert(missions).values(chunk).onConflictDoNothing(),
    SEEDS.missions,
  );
  await chunkedInsert(
    (chunk) => db.insert(missionAssignments).values(chunk).onConflictDoNothing(),
    SEEDS.missionAssignments,
  );
  await chunkedInsert(
    (chunk) =>
      db
        .insert(photos)
        .values(chunk)
        .onConflictDoUpdate({
          target: photos.id,
          set: {
            imageKey: sql`excluded.image_key`,
            // 시드 정의가 바뀌면 기존 row도 sync — 예: GPS 좌표 추가 시 재시드만으로 반영.
            exifMetadata: sql`excluded.exif_metadata`,
            updatedAt: new Date(),
          },
        }),
    SEEDS.photos,
  );
}

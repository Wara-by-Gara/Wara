import { sql } from 'drizzle-orm';
import { invitationTemplates, missionTemplates, serviceTerms, users } from '../../src/database/schema';
import type { DrizzleDB } from '../../src/database/database.module';
import { SEEDS } from './fixtures';
import { loadLegalSeeds } from './legal-loader';
import { chunkedInsert } from './util';

export async function seedTier0(db: DrizzleDB) {
  await db
    .insert(serviceTerms)
    .values(loadLegalSeeds())
    .onConflictDoNothing({ target: serviceTerms.documentId });
  await db
    .insert(invitationTemplates)
    .values(SEEDS.templates)
    .onConflictDoUpdate({
      target: invitationTemplates.id,
      set: {
        name: sql`excluded.name`,
        previewImageKey: sql`excluded.preview_image_key`,
        theme: sql`excluded.theme`,
        font: sql`excluded.font`,
        effect: sql`excluded.effect`,
        isActive: sql`excluded.is_active`,
        updatedAt: new Date(),
      },
    });
  await db.insert(missionTemplates).values(SEEDS.missionTemplates).onConflictDoNothing();
  await chunkedInsert(
    (chunk) => db.insert(users).values(chunk).onConflictDoNothing(),
    SEEDS.users,
  );
}

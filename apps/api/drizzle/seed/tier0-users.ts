import { sql } from 'drizzle-orm';
import { invitationTemplates, missionTemplates, serviceTerms, users } from '../../src/database/schema';
import type { DrizzleDB } from '../../src/database/database.module';
import { SEEDS } from './fixtures';
import { loadLegalSeeds } from './legal-loader';
import { chunkedInsert } from './util';

export async function seedTier0(db: DrizzleDB) {
  // .md SoT — frontmatter/본문이 바뀌면 시드 시 자동 동기화 (id는 유지, 나머지는 갱신)
  await db
    .insert(serviceTerms)
    .values(loadLegalSeeds())
    .onConflictDoUpdate({
      target: serviceTerms.documentId,
      set: {
        title: sql`excluded.title`,
        version: sql`excluded.version`,
        content: sql`excluded.content`,
        termType: sql`excluded.term_type`,
        isActive: sql`excluded.is_active`,
        isRequired: sql`excluded.is_required`,
        effectiveDate: sql`excluded.effective_date`,
        publishedAt: sql`excluded.published_at`,
        updatedAt: new Date(),
      },
    });
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
        prompt: sql`excluded.prompt`,
        updatedAt: new Date(),
      },
    });
  await db.insert(missionTemplates).values(SEEDS.missionTemplates).onConflictDoNothing();
  await chunkedInsert(
    (chunk) => db.insert(users).values(chunk).onConflictDoNothing(),
    SEEDS.users,
  );
}

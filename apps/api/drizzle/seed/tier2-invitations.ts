import { and, eq, isNull, notInArray, or, sql } from 'drizzle-orm';
import { invitations } from '../../src/database/schema';
import type { DrizzleDB } from '../../src/database/database.module';
import { SEEDS } from './fixtures';
import { PUBLIC_CATEGORY_SLUGS } from './public-invitation-fixtures';
import { chunkedInsert } from './util';

export async function seedTier2(db: DrizzleDB) {
  await db
    .update(invitations)
    .set({ isPublic: false, updatedAt: new Date() })
    .where(
      and(
        eq(invitations.isPublic, true),
        isNull(invitations.deletedAt),
        or(
          isNull(invitations.category),
          notInArray(invitations.category, [...PUBLIC_CATEGORY_SLUGS]),
        ),
      ),
    );

  await chunkedInsert(
    (chunk) =>
      db
        .insert(invitations)
        .values(chunk)
        .onConflictDoUpdate({
          target: invitations.id,
          set: {
            mainImageKey: sql`excluded.main_image_key`,
            mainGifUrl: sql`excluded.main_gif_url`,
            mainCoverType: sql`excluded.main_cover_type`,
            isPublic: sql`excluded.is_public`,
            category: sql`excluded.category`,
            bgColor: sql`excluded.bg_color`,
            title: sql`excluded.title`,
            description: sql`excluded.description`,
            updatedAt: new Date(),
          },
        }),
    SEEDS.invitations,
  );
}

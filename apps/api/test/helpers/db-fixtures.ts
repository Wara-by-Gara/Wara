import { JwtService } from '@nestjs/jwt';
import { ulid } from 'ulid';
import { and, eq, inArray, isNull } from 'drizzle-orm';
import type { DrizzleDB } from '../../src/database/database.module';
import * as schema from '../../src/database/schema';

export interface TestFixtures {
  userId: string;
  invitationId: string;
  participantId: string;
  guestUserId: string;
  guestParticipantId: string;
  accessToken: string;
  guestAccessToken: string;
}

export async function createTestFixtures(db: DrizzleDB, jwtService: JwtService): Promise<TestFixtures> {
  const userId = ulid();
  await db.insert(schema.users).values({
    id: userId,
    name: 'e2e-host',
    nickname: 'e2e-host',
    role: 'member',
  });

  const guestUserId = ulid();
  await db.insert(schema.users).values({
    id: guestUserId,
    name: 'e2e-guest',
    nickname: 'e2e-guest',
    role: 'member',
  });

  const invitationId = ulid();
  await db.insert(schema.invitations).values({
    id: invitationId,
    userId,
    title: 'E2E Test Invitation',
    description: 'E2E test description',
    mainCoverType: 'image',
    mainImageKey: 'test-cover-image-key',
    status: 'active',
  });

  const participantId = ulid();
  await db.insert(schema.participants).values({
    id: participantId,
    userId,
    invitationId,
    memberRole: 'HOST',
    rsvpStatus: 'attending',
  });

  const guestParticipantId = ulid();
  await db.insert(schema.participants).values({
    id: guestParticipantId,
    userId: guestUserId,
    invitationId,
    memberRole: 'GUEST',
    rsvpStatus: 'attending',
  });

  // RequiredTermsGuard: 모든 active required terms에 대해 동의 데이터 생성
  const requiredTerms = await db
    .select({ id: schema.serviceTerms.id })
    .from(schema.serviceTerms)
    .where(
      and(
        eq(schema.serviceTerms.isActive, true),
        eq(schema.serviceTerms.isRequired, true),
        isNull(schema.serviceTerms.deletedAt),
      ),
    );

  for (const term of requiredTerms) {
    await db
      .insert(schema.userTermAgreements)
      .values({ id: ulid(), userId, termId: term.id })
      .onConflictDoNothing();
    await db
      .insert(schema.userTermAgreements)
      .values({ id: ulid(), userId: guestUserId, termId: term.id })
      .onConflictDoNothing();
  }

  const accessToken = jwtService.sign({ id: userId, role: 'member', scope: [] });
  const guestAccessToken = jwtService.sign({ id: guestUserId, role: 'member', scope: [] });

  return {
    userId,
    invitationId,
    participantId,
    guestUserId,
    guestParticipantId,
    accessToken,
    guestAccessToken,
  };
}

export async function insertPhoto(
  db: DrizzleDB,
  invitationId: string,
  participantId: string,
  overrides: Partial<typeof schema.photos.$inferInsert> = {},
): Promise<typeof schema.photos.$inferSelect> {
  const [photo] = await db
    .insert(schema.photos)
    .values({
      id: ulid(),
      invitationId,
      participantId,
      imageKey: `photos/${invitationId}/${ulid()}/photo.jpg`,
      ...overrides,
    })
    .returning();
  return photo!;
}

export async function cleanPhotos(db: DrizzleDB, invitationId: string): Promise<void> {
  const photoRows = await db
    .select({ id: schema.photos.id })
    .from(schema.photos)
    .where(eq(schema.photos.invitationId, invitationId));

  if (photoRows.length > 0) {
    await db
      .delete(schema.photoLikes)
      .where(inArray(schema.photoLikes.photoId, photoRows.map((p) => p.id)));
  }
  await db.delete(schema.photos).where(eq(schema.photos.invitationId, invitationId));
}

export async function cleanAllFixtures(
  db: DrizzleDB,
  invitationId: string,
  userId: string,
  guestUserId: string,
): Promise<void> {
  await cleanPhotos(db, invitationId);
  await db.delete(schema.participants).where(eq(schema.participants.invitationId, invitationId));
  await db.delete(schema.invitations).where(eq(schema.invitations.id, invitationId));
  await db.delete(schema.users).where(eq(schema.users.id, userId));
  await db.delete(schema.users).where(eq(schema.users.id, guestUserId));
}

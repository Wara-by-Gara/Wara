import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { and, eq, inArray, isNull, notInArray } from 'drizzle-orm';
import * as schema from '../src/database/schema';
import { invitations, participants, userTermAgreements, users } from '../src/database/schema';
import { SEEDS } from '../drizzle/seed/fixtures';

/**
 * 공식 시드 fixtures(SEEDS)에 없는 계정·초대장 데이터 정리.
 *
 * - sync-esther-invitations 등으로 붙은 참가자(participants) 행 삭제
 * - fixtures에 없는 초대장 soft delete
 * - fixtures에 없는 약관 동의 행 삭제 (재로그인 시 다시 동의)
 *
 * 사용:
 *   pnpm --filter api db:cleanup-account-seed
 *   pnpm --filter api db:cleanup-account-seed lareina7486@gmail.com
 */
const DEFAULT_EMAIL = 'lareina7486@gmail.com';

async function main() {
  const email = process.argv[2] ?? process.env.CLEANUP_EMAIL ?? DEFAULT_EMAIL;
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL 환경변수가 설정되지 않았습니다.');

  const seedParticipantIds = SEEDS.participants.map((p) => p.id);
  const seedInvitationIds = SEEDS.invitations.map((i) => i.id);
  const seedTermAgreementIds = SEEDS.userTermAgreements.map((t) => t.id);

  const client = postgres(url);
  const db = drizzle(client, { schema, casing: 'snake_case' });

  try {
    const [user] = await db
      .select({ id: users.id, email: users.email, name: users.name })
      .from(users)
      .where(and(eq(users.email, email), isNull(users.deletedAt)))
      .limit(1);

    if (!user) {
      throw new Error(`'${email}' 유저를 찾지 못했습니다.`);
    }

    const accountParticipants = await db
      .select({ id: participants.id })
      .from(participants)
      .where(eq(participants.userId, user.id));

    const extraParticipantIds = accountParticipants
      .map((p) => p.id)
      .filter((id) => !seedParticipantIds.includes(id));

    let deletedParticipants = 0;
    if (extraParticipantIds.length > 0) {
      await db.delete(participants).where(inArray(participants.id, extraParticipantIds));
      deletedParticipants = extraParticipantIds.length;
    }

    const extraInvitations = await db
      .select({ id: invitations.id, title: invitations.title })
      .from(invitations)
      .where(
        and(
          isNull(invitations.deletedAt),
          notInArray(invitations.id, seedInvitationIds),
        ),
      );

    let softDeletedInvitations = 0;
    if (extraInvitations.length > 0) {
      await db
        .update(invitations)
        .set({ deletedAt: new Date(), updatedAt: new Date() })
        .where(
          and(
            isNull(invitations.deletedAt),
            notInArray(invitations.id, seedInvitationIds),
          ),
        );
      softDeletedInvitations = extraInvitations.length;
    }

    const accountTerms = await db
      .select({ id: userTermAgreements.id })
      .from(userTermAgreements)
      .where(eq(userTermAgreements.userId, user.id));

    const extraTermIds = accountTerms
      .map((t) => t.id)
      .filter((id) => !seedTermAgreementIds.includes(id));

    let deletedTerms = 0;
    if (extraTermIds.length > 0) {
      await db.delete(userTermAgreements).where(inArray(userTermAgreements.id, extraTermIds));
      deletedTerms = extraTermIds.length;
    }

    process.stdout.write(
      [
        `[cleanup] 대상: ${user.name} (${user.email})`,
        `[cleanup] 삭제한 participants(시드 외): ${deletedParticipants}건`,
        `[cleanup] soft delete한 invitations(시드 외): ${softDeletedInvitations}건`,
        `[cleanup] 삭제한 user_term_agreements(시드 외): ${deletedTerms}건`,
      ].join('\n') + '\n',
    );
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  process.stderr.write(
    `[cleanup] 오류: ${e instanceof Error ? e.message : String(e)}\n`,
  );
  process.exit(1);
});

import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { and, eq, isNull, ne, notInArray, sql } from 'drizzle-orm';
import { ulid } from 'ulid';
import * as schema from '../src/database/schema';
import { invitations, participants, users } from '../src/database/schema';

const TARGET_NAME = '강에스더';
/** 타인 초대장 참가 목표 수 (시드 초대장 100건 전부 참가) */
const TARGET_JOINED_INVITATIONS = 100;

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL 환경변수가 설정되지 않았습니다.');

  const client = postgres(url);
  const db = drizzle(client, { schema, casing: 'snake_case' });

  try {
    const [user] = await db
      .select({ id: users.id, name: users.name, email: users.email })
      .from(users)
      .where(and(eq(users.name, TARGET_NAME), isNull(users.deletedAt)))
      .limit(1);

    if (!user) {
      throw new Error(`'${TARGET_NAME}' 유저를 찾지 못했습니다.`);
    }

    const ownedBefore = await db
      .select({ id: invitations.id })
      .from(invitations)
      .where(and(eq(invitations.userId, user.id), isNull(invitations.deletedAt)));

    if (ownedBefore.length > 0) {
      await db
        .update(invitations)
        .set({ deletedAt: new Date(), updatedAt: new Date() })
        .where(and(eq(invitations.userId, user.id), isNull(invitations.deletedAt)));
    }

    const existingJoined = await db
      .select({ invitationId: participants.invitationId })
      .from(participants)
      .innerJoin(invitations, eq(participants.invitationId, invitations.id))
      .where(
        and(
          eq(participants.userId, user.id),
          isNull(invitations.deletedAt),
          ne(invitations.userId, user.id),
        ),
      );

    const joinedIds = new Set(existingJoined.map((r) => r.invitationId));
    const need = Math.max(0, TARGET_JOINED_INVITATIONS - joinedIds.size);

    if (need === 0) {
      process.stdout.write(
        `[sync-esther] 이미 목표(${TARGET_JOINED_INVITATIONS}개)에 도달했습니다.\n`,
      );
      return;
    }

    const eligible = await db
      .select({ id: invitations.id, title: invitations.title })
      .from(invitations)
      .where(
        and(
          isNull(invitations.deletedAt),
          ne(invitations.userId, user.id),
          joinedIds.size > 0
            ? notInArray(invitations.id, [...joinedIds])
            : sql`true`,
        ),
      )
      .limit(need);

    if (eligible.length < need) {
      throw new Error(
        `참가 가능한 초대장이 부족합니다. 필요 ${need}개, 가능 ${eligible.length}개`,
      );
    }

    const toJoin = eligible;
    if (toJoin.length > 0) {
      await db.insert(participants).values(
        toJoin.map((inv) => ({
          id: ulid(),
          userId: user.id,
          invitationId: inv.id,
          memberRole: 'GUEST' as const,
          rsvpStatus: 'attending' as const,
        })),
      );
    }

    const joinedAfter = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(participants)
      .innerJoin(invitations, eq(participants.invitationId, invitations.id))
      .where(
        and(
          eq(participants.userId, user.id),
          isNull(invitations.deletedAt),
          ne(invitations.userId, user.id),
        ),
      );

    process.stdout.write(
      [
        `[sync-esther] 유저: ${user.name} (${user.email}) id=${user.id}`,
        `[sync-esther] 소프트 삭제한 내 초대장: ${ownedBefore.length}개`,
        `[sync-esther] 새로 참가 등록: ${toJoin.length}개`,
        `[sync-esther] 타인 초대장 참가 수(합계): ${joinedAfter[0]?.count ?? 0}개`,
      ].join('\n') + '\n',
    );
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  process.stderr.write(
    `[sync-esther] 오류: ${e instanceof Error ? e.message : String(e)}\n`,
  );
  process.exit(1);
});

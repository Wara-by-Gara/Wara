// apps/api/drizzle/seed/seed.ts
// 목적: k6 부하 테스트용 대량 데이터
//       50K users / 50K invitations / 200K participants / 100K notifications
// 실행: docker 내부 네트워크 방식 (MEMORY.md 참고)
//


import { createHash } from 'crypto';
import { writeFileSync } from 'fs';
import path from 'path';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { sql } from 'drizzle-orm';
import { sign } from 'jsonwebtoken';
import * as schema from '../../src/database/schema';
import { chunkedInsert } from './util';

// ── 규모 상수 ─────────────────────────────────────────────────────────────────
const HOST_COUNT     = 5_000;  // 초대장 호스트 수
const GUEST_COUNT    = 45_000; // 게스트 수
const INV_COUNT      = 50_000; // 초대장 수 (host당 10개)
const GUESTS_PER_INV = 3;      // 초대장당 게스트 참가자 수 (+ HOST 1 = 4명)
const NOTIF_COUNT    = 100_000; // 알림 수 (user당 2개 평균)
const BATCH          = 1_000;  // 배치 크기 (PostgreSQL 파라미터 한계 65535 우회)
const TOKEN_DAYS     = 7;      // JWT 만료 일수

// ── 결정적 ID ─────────────────────────────────────────────────────────────────
// SHA-256 해시 → Crockford Base32 26자 (ULID 호환)
// 동일 seed 문자열 → 항상 동일 ID → re-run 시 onConflictDoNothing으로 멱등 처리
const CROCKFORD = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

function deterministicId(seed: string): string {
  const hash = createHash('sha256').update(`wara-load:${seed}`).digest();
  let result = '';
  let buf = 0;
  let bits = 0;
  for (let i = 0; i < hash.length && result.length < 26; i++) {
    buf = (buf << 8) | hash[i]!;
    bits += 8;
    while (bits >= 5 && result.length < 26) {
      bits -= 5;
      result += CROCKFORD[(buf >> bits) & 0x1f]!;
    }
  }
  return result;
}

// 각 엔티티별 ID 헬퍼 — 인덱스에서 재현 가능한 ID 생성
// prefix 'load:' 로 기존 fixtures.ts 시드와 충돌 방지
const hostId  = (i: number) => deterministicId(`host:${i}`);
const guestId = (i: number) => deterministicId(`guest:${i}`);
const invId   = (i: number) => deterministicId(`inv:${i}`);
// slot 0 = HOST participant, slot 1~3 = GUEST participant
const partId  = (invIdx: number, slot: number) => deterministicId(`part:${invIdx}:${slot}`);
const notifId = (i: number) => deterministicId(`notif:${i}`);

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL 환경변수 없음');

  const secret = process.env.JWT_ACCESS_SECRET;

  const client = postgres(url);
  const db = drizzle(client, { schema, casing: 'snake_case' });
  const log = (msg: string) => process.stdout.write(`[load-seed] ${msg}\n`);

  // ── 이메일 중복 체크 ───────────────────────────────────────────────────────
  // @seed.load 도메인 유저가 이미 있으면 해당 이메일 skip
  // 기존 @seed.wara (index.ts 시드) 데이터와 도메인이 달라 충돌 없음
  log('기존 seed 유저 확인...');
  const existing = await db
    .select({ email: schema.users.email })
    .from(schema.users)
    .where(sql`email LIKE '%@seed.load'`);
  const existingEmails = new Set(existing.map((r) => r.email));
  log(`기존 @seed.load 유저: ${existingEmails.size}건`);

  // ── Users 생성 ─────────────────────────────────────────────────────────────
  log('유저 생성 중...');

  const hostUsers: (typeof schema.users.$inferInsert)[] = [];
  for (let i = 0; i < HOST_COUNT; i++) {
    const email = `host_${i}@seed.load`;
    if (existingEmails.has(email)) continue; // 이미 있으면 skip
    hostUsers.push({
      id: hostId(i),
      email,
      name: `부하테스트호스트${i}`,
      nickname: `host${i}`,
      role: 'member',
    });
  }

  const guestUsers: (typeof schema.users.$inferInsert)[] = [];
  for (let i = 0; i < GUEST_COUNT; i++) {
    const email = `guest_${i}@seed.load`;
    if (existingEmails.has(email)) continue;
    guestUsers.push({
      id: guestId(i),
      email,
      name: `부하테스트게스트${i}`,
      nickname: `guest${i}`,
      role: 'member',
    });
  }

  // onConflictDoNothing: PK(id) 충돌 시 무시 (email skip과 이중 안전망)
  await chunkedInsert(
    (chunk) => db.insert(schema.users).values(chunk).onConflictDoNothing(),
    hostUsers,
    BATCH,
  );
  await chunkedInsert(
    (chunk) => db.insert(schema.users).values(chunk).onConflictDoNothing(),
    guestUsers,
    BATCH,
  );
  log(`✓ 유저 — hosts ${hostUsers.length}건, guests ${guestUsers.length}건 삽입`);

  // ── User Term Agreements 생성 ─────────────────────────────────────────────
  // service_terms 중 is_required=true AND deleted_at IS NULL 인 약관에 전원 동의 처리
  // uq_user_term_agreements_user_term(userId, termId) → onConflictDoNothing 재실행 안전
  // agreement ID: deterministicId로 멱등 보장 (동일 userId+termId → 동일 ID)
  log('필수 약관 조회 중...');

  const requiredTerms = await db
    .select({ id: schema.serviceTerms.id })
    .from(schema.serviceTerms)
    .where(sql`is_required = true AND deleted_at IS NULL`);

  if (requiredTerms.length === 0) {
    log('⚠️  필수 약관 없음 → user_term_agreements 생성 건너뜀 (index.ts 시드 먼저 실행 필요)');
  } else {
    log(`필수 약관 ${requiredTerms.length}건 × seed user 50,000명 동의 처리 중...`);

    const allSeedUserIds: string[] = [
      ...Array.from({ length: HOST_COUNT }, (_, i) => hostId(i)),
      ...Array.from({ length: GUEST_COUNT }, (_, i) => guestId(i)),
    ];

    const agreements: (typeof schema.userTermAgreements.$inferInsert)[] = [];
    for (const term of requiredTerms) {
      for (const userId of allSeedUserIds) {
        agreements.push({
          id: deterministicId(`agreement:${userId}:${term.id}`),
          userId,
          termId: term.id,
        });
      }
    }

    await chunkedInsert(
      (chunk) => db.insert(schema.userTermAgreements).values(chunk).onConflictDoNothing(),
      agreements,
      BATCH,
    );
    log(`✓ user_term_agreements — ${agreements.length}건 (약관 ${requiredTerms.length}건 × user 50,000명)`);
  }

  // ── Invitations 생성 ───────────────────────────────────────────────────────
  // host 0~4999에게 10개씩 배분: i % HOST_COUNT 순환
  // mainCoverType='image' → mainImageKey NOT NULL 필수 (check_cover_type_image 제약)
  log('초대장 생성 중...');

  const invitations: (typeof schema.invitations.$inferInsert)[] = [];
  for (let i = 0; i < INV_COUNT; i++) {
    invitations.push({
      id: invId(i),
      userId: hostId(i % HOST_COUNT),
      status: 'active',
      title: `부하테스트 초대장 ${i}`,
      description: `k6 부하 테스트용 초대장입니다. (${i})`,
      mainCoverType: 'image',
      mainImageKey: `seed/load/cover/${i % 100}.jpg`, // 100개 키 순환 (실제 파일 불필요)
      isMissionEnabled: false,
    });
  }

  await chunkedInsert(
    (chunk) => db.insert(schema.invitations).values(chunk).onConflictDoNothing(),
    invitations,
    BATCH,
  );
  log(`✓ 초대장 — ${invitations.length}건`);

  // ── Participants 생성 ──────────────────────────────────────────────────────
  // 각 초대장마다 HOST 1명 + GUEST 3명 = 4명 (총 200,000건)
  // uq_participants_user_invitation(userId, invitationId): 동일 초대장에 동일 유저 중복 불가
  // 게스트 순환 배분: guestId((i * 3 + slot) % 45000) → 45000명에게 고르게 분산
  log('참가자 생성 중...');

  const participants: (typeof schema.participants.$inferInsert)[] = [];
  for (let i = 0; i < INV_COUNT; i++) {
    // slot 0: 해당 초대장 호스트 (HOST role, 이미 rsvp 확정)
    participants.push({
      id: partId(i, 0),
      userId: hostId(i % HOST_COUNT),
      invitationId: invId(i),
      memberRole: 'HOST',
      rsvpStatus: 'attending',
    });
    // slot 1~3: 게스트 순환 배분
    for (let s = 1; s <= GUESTS_PER_INV; s++) {
      participants.push({
        id: partId(i, s),
        userId: guestId((i * GUESTS_PER_INV + (s - 1)) % GUEST_COUNT),
        invitationId: invId(i),
        memberRole: 'GUEST',
        rsvpStatus: 'attending',
      });
    }
  }

  await chunkedInsert(
    (chunk) => db.insert(schema.participants).values(chunk).onConflictDoNothing(),
    participants,
    BATCH,
  );
  log(`✓ 참가자 — ${participants.length}건`);

  // ── Notifications 생성 ─────────────────────────────────────────────────────
  // 50,000명에게 2개씩 배분: i % TOTAL_USERS 순환
  // targetType / targetId: 둘 다 null → check_notification_target 제약 통과
  //   (IS NULL AND IS NULL) = TRUE
  // isRead: 약 1/3은 읽음 → countUnreadByUser 쿼리에 현실감
  log('알림 생성 중...');

  const TOTAL_USERS = HOST_COUNT + GUEST_COUNT; // 50,000
  const NOTIF_TYPES = ['feedback', 'arrived', 'remind', 'photo'] as const;

  const notifications: (typeof schema.notifications.$inferInsert)[] = [];
  for (let i = 0; i < NOTIF_COUNT; i++) {
    const slot = i % TOTAL_USERS;
    const userId = slot < HOST_COUNT ? hostId(slot) : guestId(slot - HOST_COUNT);
    notifications.push({
      id: notifId(i),
      userId,
      type: NOTIF_TYPES[i % NOTIF_TYPES.length]!,
      content: `부하테스트 알림 ${i}`,
      isRead: i % 3 === 0,
    });
  }

  await chunkedInsert(
    (chunk) => db.insert(schema.notifications).values(chunk).onConflictDoNothing(),
    notifications,
    BATCH,
  );
  log(`✓ 알림 — ${notifications.length}건`);

  // ── seed-tokens.json 생성 ──────────────────────────────────────────────────
  // k6 SharedArray로 읽는 JWT 토큰 파일
  // hosts 5,000 + guests 45,000 전체 포함 (예상 ~20MB)
  // .gitignore에 seed-tokens.json 등록 확인 필요 (JWT secret 포함)
  if (!secret) {
    log('⚠️  JWT_ACCESS_SECRET 없음 → seed-tokens.json 생성 건너뜀');
  } else {
    log('토큰 파일 생성 중 (JWT 서명 50,000건)...');

    // participants 배열에서 userId → invitationIds 역인덱스 구성
    // k6 시나리오에서 "내가 참여한 초대장" 페어 조회에 사용
    const invsByUser = new Map<string, string[]>();
    for (const p of participants) {
      const uid = p.userId as string;
      const iid = p.invitationId as string;
      const list = invsByUser.get(uid);
      if (list) list.push(iid);
      else invsByUser.set(uid, [iid]);
    }

    const issue = (userId: string) =>
      sign({ id: userId, role: 'member', scope: [] }, secret, {
        expiresIn: `${TOKEN_DAYS}d`,
      });

    const hosts = Array.from({ length: HOST_COUNT }, (_, i) => {
      const uid = hostId(i);
      return { id: uid, token: issue(uid), invitationIds: invsByUser.get(uid) ?? [] };
    });

    const guests = Array.from({ length: GUEST_COUNT }, (_, i) => {
      const uid = guestId(i);
      return { id: uid, token: issue(uid), invitationIds: invsByUser.get(uid) ?? [] };
    });

    const out = path.resolve(__dirname, 'seed-tokens.json');
    writeFileSync(
      out,
      JSON.stringify(
        { generatedAt: new Date().toISOString(), expiresInDays: TOKEN_DAYS, hosts, guests },
        null,
        2,
      ),
      'utf8',
    );
    log(`✓ seed-tokens.json — hosts ${hosts.length}건, guests ${guests.length}건`);
  }

  log('시드 완료!');
  await client.end();
}

main().catch((err: Error) => {
  process.stderr.write(`[load-seed] 오류: ${err.message}\n${err.stack ?? ''}\n`);
  process.exit(1);
});

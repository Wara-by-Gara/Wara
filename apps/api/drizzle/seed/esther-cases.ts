/**
 * 강에스더(실제 계정) 전용 케이스 시드.
 * GUEST로 참여하는 다양한 상황(투표 진행중/종료/확정, 참석자 다수/소수, 마감 임박,
 * 불참, 공개 이벤트 등) + 강에스더가 HOST인 케이스 몇 개를 넣는다.
 *
 * - 기존 fixtures 시드와 독립. 결정적 ULID + upsert라 재실행해도 중복되지 않는다.
 * - 호스트/코-참가자는 기존 시드 유저(host..., guest...)를 재사용한다.
 * 실행: pnpm db:seed:esther
 */
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq, like, sql } from 'drizzle-orm';
import { createHash } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import * as schema from '../../src/database/schema';

const ESTHER_EMAIL = 'lareina7486@gmail.com';

// fixtures.ts의 id()와 동일 알고리즘 — 결정적 26자 Crockford ULID (재실행 idempotency)
const CROCKFORD = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
function sid(seed: string): string {
  const hash = createHash('sha256').update(`wara-esther:${seed}`).digest();
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

// ── template_images 풀 (mainImageKey / 사진용) ───────────────────────────────
const FRONTEND_URL = (process.env.FRONTEND_URL ?? 'http://localhost:3000').replace(/\/$/, '');
function collectImagePool(): string[] {
  const root = path.resolve(__dirname, '../../../web/public/template_images');
  if (!fs.existsSync(root)) return [];
  const all: string[] = [];
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    for (const file of fs.readdirSync(path.join(root, entry.name))) {
      if (/\.(png|jpe?g|webp)$/i.test(file)) all.push(`/template_images/${entry.name}/${file}`);
    }
  }
  return all.sort();
}
const IMAGE_POOL = collectImagePool();
const urlFromRel = (rel: string) =>
  `${FRONTEND_URL}/${rel.split('/').filter(Boolean).map(encodeURIComponent).join('/')}`;
/** 초대장별로 풀을 결정적으로 셔플 → 앞에서부터 distinct하게 사용 (한 초대장 내 중복 방지) */
function shuffledImages(caseKey: string): string[] {
  return [...IMAGE_POOL]
    .map((rel) => ({ rel, sort: createHash('sha256').update(`estr-img:${caseKey}:${rel}`).digest('hex') }))
    .sort((a, b) => (a.sort < b.sort ? -1 : a.sort > b.sort ? 1 : 0))
    .map((x) => x.rel);
}

// ── 날짜 유틸 (기준: 지금) ────────────────────────────────────────────────────
const NOW = new Date();
const addDays = (base: Date, d: number) => new Date(base.getTime() + d * 86400000);
const ymd = (d: Date) => d.toISOString().slice(0, 10);

type Rsvp = 'attending' | 'undecided' | 'absent';
type CoMode = 'all-attending' | 'mostly-attending' | 'mixed';

interface VoteSpec {
  status: 'open' | 'closed' | 'confirmed';
  closesAt: Date;
  slots: Array<{ date: Date; startTime: string | null }>;
  estherVoted: boolean;
  confirmedSlotIdx?: number;
}

interface CaseSpec {
  key: string;
  title: string;
  description: string;
  esther: 'GUEST' | 'HOST';
  estherRsvp: Rsvp;
  coCount: number; // 강에스더·호스트 제외한 추가 게스트 수
  coMode: CoMode;
  status: 'active' | 'closed';
  eventStartAt: Date | null;
  rsvpDeadlineAt?: Date | null;
  isPublic?: boolean;
  category?: string | null;
  isMissionEnabled?: boolean;
  vote?: VoteSpec;
  photoCount?: number;
  location?: boolean;
}

// 공통 슬롯 3종 (다음 주말들)
const slot3 = (anchor: Date) => [
  { date: addDays(anchor, 0), startTime: '18:00' },
  { date: addDays(anchor, 1), startTime: '12:00' },
  { date: addDays(anchor, 7), startTime: null },
];

const CASES: CaseSpec[] = [
  // 1. 투표 진행중 · 강에스더 미투표
  {
    key: 'vote-open-novote', title: '🍷 와인 한잔 모임 (날짜 투표중)',
    description: '다들 언제 좋은지 투표해주세요! 마감 전에 꼭 참여 부탁해요.',
    esther: 'GUEST', estherRsvp: 'undecided', coCount: 7, coMode: 'mixed', status: 'active',
    eventStartAt: null, photoCount: 0,
    vote: { status: 'open', closesAt: addDays(NOW, 5), slots: slot3(addDays(NOW, 10)), estherVoted: false },
  },
  // 2. 투표 진행중 · 강에스더 투표 완료
  {
    key: 'vote-open-voted', title: '🎳 볼링 번개 (투표 참여 완료)',
    description: '주말 중에 모여서 볼링 한 게임 어때요?',
    esther: 'GUEST', estherRsvp: 'undecided', coCount: 9, coMode: 'mixed', status: 'active',
    eventStartAt: null, photoCount: 0,
    vote: { status: 'open', closesAt: addDays(NOW, 4), slots: slot3(addDays(NOW, 9)), estherVoted: true },
  },
  // 3. 투표 종료 · 날짜 미확정
  {
    key: 'vote-closed', title: '🍲 동네 맛집 탐방 (투표 마감)',
    description: '투표는 마감됐어요. 호스트가 곧 날짜를 정할 예정이에요.',
    esther: 'GUEST', estherRsvp: 'undecided', coCount: 6, coMode: 'mixed', status: 'active',
    eventStartAt: null, photoCount: 0,
    vote: { status: 'closed', closesAt: addDays(NOW, -2), slots: slot3(addDays(NOW, 6)), estherVoted: true },
  },
  // 4. 투표 종료 · 날짜 확정
  {
    key: 'vote-confirmed', title: '🏖️ 여름 바닷가 여행 (날짜 확정!)',
    description: '투표 결과 날짜가 확정됐습니다. 다들 일정 비워주세요!',
    esther: 'GUEST', estherRsvp: 'attending', coCount: 11, coMode: 'mostly-attending', status: 'active',
    eventStartAt: addDays(NOW, 20), location: true, photoCount: 0,
    vote: { status: 'confirmed', closesAt: addDays(NOW, -3), slots: slot3(addDays(NOW, 20)), estherVoted: true, confirmedSlotIdx: 0 },
  },
  // 5. 참석자 매우 많음 · 다가오는 모임
  {
    key: 'many-guests', title: '🎉 대규모 송년 파티',
    description: '올해의 마무리, 다같이 모여요! 인원이 많으니 일찍 와주세요.',
    esther: 'GUEST', estherRsvp: 'attending', coCount: 43, coMode: 'mostly-attending', status: 'active',
    eventStartAt: addDays(NOW, 12), location: true, photoCount: 0,
  },
  // 6. 참석자 적음
  {
    key: 'few-guests', title: '☕ 조용한 카페 수다',
    description: '소수정예로 도란도란 이야기 나눠요.',
    esther: 'GUEST', estherRsvp: 'attending', coCount: 1, coMode: 'all-attending', status: 'active',
    eventStartAt: addDays(NOW, 6), location: true, photoCount: 0,
  },
  // 7. 참석자 중간
  {
    key: 'mid-guests', title: '🍳 주말 브런치 모임',
    description: '느긋한 주말 브런치 함께해요.',
    esther: 'GUEST', estherRsvp: 'undecided', coCount: 14, coMode: 'mixed', status: 'active',
    eventStartAt: addDays(NOW, 9), location: true, photoCount: 0,
  },
  // 8. 다가오는 모임 (D-3) · 참석 확정
  {
    key: 'upcoming-soon', title: '🎬 영화 + 저녁 번개 (D-3)',
    description: '이번 주 금요일 저녁, 영화 보고 밥 먹어요!',
    esther: 'GUEST', estherRsvp: 'attending', coCount: 8, coMode: 'mostly-attending', status: 'active',
    eventStartAt: addDays(NOW, 3), location: true, photoCount: 0,
  },
  // 9. 지난 모임 · 마감 · 사진 추억
  {
    key: 'past-album', title: '🌸 봄 소풍 (지난 모임 추억)',
    description: '즐거웠던 봄 소풍! 사진 구경하고 댓글 남겨주세요.',
    esther: 'GUEST', estherRsvp: 'attending', coCount: 10, coMode: 'mostly-attending', status: 'closed',
    eventStartAt: addDays(NOW, -14), location: true, photoCount: 18,
  },
  // 10. RSVP 마감 임박 (D-1)
  {
    key: 'rsvp-deadline', title: '⏰ 응답 마감 임박! 집들이',
    description: '내일까지 참석 여부 응답 부탁드려요.',
    esther: 'GUEST', estherRsvp: 'undecided', coCount: 7, coMode: 'mixed', status: 'active',
    eventStartAt: addDays(NOW, 8), rsvpDeadlineAt: addDays(NOW, 1), location: true, photoCount: 0,
  },
  // 11. 불참 케이스
  {
    key: 'esther-absent', title: '🏀 농구 동호회 정기모임',
    description: '이번엔 못 오신다구요? 다음엔 꼭 함께해요!',
    esther: 'GUEST', estherRsvp: 'absent', coCount: 13, coMode: 'mostly-attending', status: 'active',
    eventStartAt: addDays(NOW, 7), location: true, photoCount: 0,
  },
  // 12. 공개 탐색 이벤트 + 미션 활성
  {
    key: 'public-mission', title: '🧑‍💻 개발자 네트워킹 밋업',
    description: '누구나 참여 가능한 공개 밋업! 미션도 즐겨보세요.',
    esther: 'GUEST', estherRsvp: 'attending', coCount: 22, coMode: 'mostly-attending', status: 'active',
    eventStartAt: addDays(NOW, 15), isPublic: true, category: 'tech', isMissionEnabled: true, location: true, photoCount: 0,
  },

  // ── 강에스더가 HOST인 케이스 ───────────────────────────────────────────────
  // 13. HOST · 다가오는 모임 · 참석자 다수
  {
    key: 'host-upcoming', title: '🎂 강에스더의 생일 파티',
    description: '제 생일에 초대합니다! 와주실 거죠?',
    esther: 'HOST', estherRsvp: 'attending', coCount: 28, coMode: 'mostly-attending', status: 'active',
    eventStartAt: addDays(NOW, 10), location: true, photoCount: 0,
  },
  // 14. HOST · 투표 진행중
  {
    key: 'host-vote-open', title: '📅 강에스더 주최 스터디 (날짜 투표중)',
    description: '스터디 첫 모임 날짜를 투표로 정해요!',
    esther: 'HOST', estherRsvp: 'attending', coCount: 11, coMode: 'mixed', status: 'active',
    eventStartAt: null, photoCount: 0,
    vote: { status: 'open', closesAt: addDays(NOW, 6), slots: slot3(addDays(NOW, 13)), estherVoted: true },
  },
  // 15. HOST · 지난 모임 · 사진 추억
  {
    key: 'host-past-album', title: '🍗 강에스더네 홈파티 (지난 모임)',
    description: '지난 홈파티 사진 모음! 즐거웠어요.',
    esther: 'HOST', estherRsvp: 'attending', coCount: 9, coMode: 'mostly-attending', status: 'closed',
    eventStartAt: addDays(NOW, -21), location: true, photoCount: 12,
  },
];

const SEOUL = { lat: 37.5665, lng: 126.978 };
const PLACE_NAMES = ['연남동 공유주방', '성수동 루프탑', '한강공원 잔디밭', '강남 모임공간', '홍대 파티룸', '이태원 라운지'];

function coRsvp(mode: CoMode, i: number): Rsvp {
  if (mode === 'all-attending') return 'attending';
  if (mode === 'mostly-attending') return i % 6 === 0 ? 'undecided' : i % 11 === 0 ? 'absent' : 'attending';
  // mixed
  const pat: Rsvp[] = ['attending', 'attending', 'undecided', 'absent', 'attending', 'undecided'];
  return pat[i % pat.length]!;
}

const voteResp = (i: number): 'good' | 'maybe' | 'bad' => (['good', 'good', 'maybe', 'bad', 'good'] as const)[i % 5]!;

/** onConflictDoUpdate의 excluded.<col> 참조 */
const sql_excluded = (col: string) => sql.raw(`excluded.${col}`);

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL 환경변수가 설정되지 않았습니다.');
  const client = postgres(url);
  const db = drizzle(client, { schema, casing: 'snake_case' });
  const log = (m: string) => process.stdout.write(`[esther-seed] ${m}\n`);

  // 1) 강에스더 + 코-참가자/호스트 풀 조회
  const esther = await db.query.users.findFirst({ where: eq(schema.users.email, ESTHER_EMAIL) });
  if (!esther) throw new Error(`강에스더 계정(${ESTHER_EMAIL})을 찾을 수 없습니다.`);

  const hostUsers = await db.select({ id: schema.users.id }).from(schema.users).where(like(schema.users.email, 'host%'));
  const guestUsers = await db.select({ id: schema.users.id }).from(schema.users).where(like(schema.users.email, 'guest%'));
  if (hostUsers.length === 0 || guestUsers.length === 0) {
    throw new Error('host*/guest* 시드 유저가 없습니다. 먼저 pnpm db:seed 를 실행하세요.');
  }
  const hostIds = hostUsers.map((u) => u.id);
  const guestIds = guestUsers.map((u) => u.id);
  log(`강에스더=${esther.id}, 호스트풀=${hostIds.length}, 게스트풀=${guestIds.length}`);

  const templates = await db.select({ id: schema.invitationTemplates.id }).from(schema.invitationTemplates).where(eq(schema.invitationTemplates.isActive, true));
  const templateIds = templates.map((t) => t.id);

  // 누적 버퍼
  const invitations: (typeof schema.invitations.$inferInsert)[] = [];
  const participants: (typeof schema.participants.$inferInsert)[] = [];
  const polls: (typeof schema.dateVotePolls.$inferInsert)[] = [];
  const slots: (typeof schema.dateVoteSlots.$inferInsert)[] = [];
  const responses: (typeof schema.dateVoteResponses.$inferInsert)[] = [];
  const eventLocations: (typeof schema.eventLocations.$inferInsert)[] = [];
  const photos: (typeof schema.photos.$inferInsert)[] = [];

  let guestCursor = 0; // 케이스마다 다른 게스트 슬라이스 사용

  CASES.forEach((c, ci) => {
    const invId = sid(`inv:${c.key}`);
    const imgPool = shuffledImages(c.key);
    const mainImage = imgPool[0] ? urlFromRel(imgPool[0]) : null;
    const hostUserId = c.esther === 'HOST' ? esther.id : hostIds[ci % hostIds.length]!;

    invitations.push({
      id: invId,
      userId: hostUserId,
      templateId: templateIds[ci % Math.max(templateIds.length, 1)] ?? null,
      status: c.status,
      title: c.title,
      description: c.description,
      mainCoverType: 'image',
      mainImageKey: mainImage,
      eventStartAt: c.eventStartAt,
      rsvpDeadlineAt: c.rsvpDeadlineAt ?? null,
      isMissionEnabled: c.isMissionEnabled ?? false,
      isPublic: c.isPublic ?? false,
      category: c.category ?? null,
      viewCount: 10 + ci * 7,
    });

    // 참가자 구성: HOST 1 + 강에스더(GUEST 또는 HOST) + 코-게스트들
    type PRow = { userId: string; role: 'HOST' | 'GUEST'; rsvp: Rsvp };
    const pRows: PRow[] = [];
    if (c.esther === 'HOST') {
      pRows.push({ userId: esther.id, role: 'HOST', rsvp: 'attending' });
    } else {
      pRows.push({ userId: hostUserId, role: 'HOST', rsvp: 'attending' });
      pRows.push({ userId: esther.id, role: 'GUEST', rsvp: c.estherRsvp });
    }
    // 코-게스트 (강에스더·호스트와 중복되지 않는 distinct 슬라이스)
    const used = new Set(pRows.map((p) => p.userId));
    let added = 0;
    while (added < c.coCount) {
      const gid = guestIds[guestCursor % guestIds.length]!;
      guestCursor++;
      if (used.has(gid)) continue;
      used.add(gid);
      pRows.push({ userId: gid, role: 'GUEST', rsvp: coRsvp(c.coMode, added) });
      added++;
    }

    // participant id 매핑
    const partIdByUser = new Map<string, string>();
    pRows.forEach((p) => {
      const pid = sid(`part:${c.key}:${p.userId}`);
      partIdByUser.set(p.userId, pid);
      participants.push({
        id: pid,
        userId: p.userId,
        invitationId: invId,
        memberRole: p.role,
        rsvpStatus: p.rsvp,
      });
    });

    // 날짜 투표
    if (c.vote) {
      const pollId = sid(`poll:${c.key}`);
      const slotIds = c.vote.slots.map((_, si) => sid(`slot:${c.key}:${si}`));
      polls.push({
        id: pollId,
        invitationId: invId,
        closesAt: c.vote.closesAt,
        status: c.vote.status,
        isAnonymous: false,
        confirmedSlotId: c.vote.confirmedSlotIdx != null ? slotIds[c.vote.confirmedSlotIdx]! : null,
      });
      c.vote.slots.forEach((s, si) => {
        slots.push({ id: slotIds[si]!, pollId, date: ymd(s.date), startTime: s.startTime, sortOrder: si });
      });
      // 응답: 코-게스트 다수 + (강에스더 투표했으면 강에스더도)
      const voters = pRows.filter((p) => p.userId !== esther.id || c.vote!.estherVoted);
      voters.forEach((v, vi) => {
        // 일부만 응답 (전부는 아님)
        if (vi % 4 === 3) return;
        slotIds.forEach((slotId, si) => {
          responses.push({
            id: sid(`resp:${c.key}:${v.userId}:${si}`),
            slotId,
            participantId: partIdByUser.get(v.userId)!,
            response: voteResp(vi + si),
          });
        });
      });
    }

    // 위치
    if (c.location) {
      eventLocations.push({
        id: sid(`loc:${c.key}`),
        invitationId: invId,
        address: `서울특별시 ${PLACE_NAMES[ci % PLACE_NAMES.length]} 일대`,
        placeName: PLACE_NAMES[ci % PLACE_NAMES.length]!,
        detailAddress: `${100 + ci}호`,
        lat: SEOUL.lat + ((ci % 7) - 3) * 0.01,
        lng: SEOUL.lng + ((ci % 5) - 2) * 0.01,
        placeId: `estr-place-${c.key}`,
      });
    }

    // 사진 (지난 모임 추억) — 참가자들이 업로드, 한 초대장 내 distinct
    if (c.photoCount && c.photoCount > 0) {
      const uploaders = pRows.map((p) => partIdByUser.get(p.userId)!);
      for (let i = 0; i < c.photoCount; i++) {
        const rel = imgPool[i % imgPool.length];
        if (!rel) break;
        photos.push({
          id: sid(`photo:${c.key}:${i}`),
          participantId: uploaders[i % uploaders.length]!,
          invitationId: invId,
          imageKey: urlFromRel(rel),
          takenAt: addDays(c.eventStartAt ?? NOW, 0),
          exifMetadata: {
            width: 1280, height: 853, camera: 'iPhone 15',
            gps_lat: SEOUL.lat + ((i % 9) - 4) * 0.004,
            gps_lng: SEOUL.lng + ((ci % 9) - 4) * 0.004,
          },
          viewCount: i * 2,
        });
      }
    }
  });

  // 2) 삽입 (의존성 순서, upsert로 멱등)
  await db.insert(schema.invitations).values(invitations).onConflictDoUpdate({
    target: schema.invitations.id,
    set: {
      title: sql_excluded('title'), description: sql_excluded('description'),
      status: sql_excluded('status'), eventStartAt: sql_excluded('event_start_at'),
      rsvpDeadlineAt: sql_excluded('rsvp_deadline_at'), mainImageKey: sql_excluded('main_image_key'),
      isPublic: sql_excluded('is_public'), category: sql_excluded('category'),
      isMissionEnabled: sql_excluded('is_mission_enabled'), updatedAt: new Date(),
    },
  });
  log(`✓ invitations: ${invitations.length}건`);

  await db.insert(schema.participants).values(participants).onConflictDoUpdate({
    target: [schema.participants.userId, schema.participants.invitationId],
    set: { memberRole: sql_excluded('member_role'), rsvpStatus: sql_excluded('rsvp_status'), updatedAt: new Date() },
  });
  log(`✓ participants: ${participants.length}건 (강에스더 참여 ${CASES.length}건)`);

  if (polls.length) {
    await db.insert(schema.dateVotePolls).values(polls).onConflictDoUpdate({
      target: schema.dateVotePolls.invitationId,
      set: { status: sql_excluded('status'), closesAt: sql_excluded('closes_at'), confirmedSlotId: sql_excluded('confirmed_slot_id'), updatedAt: new Date() },
    });
    await db.insert(schema.dateVoteSlots).values(slots).onConflictDoNothing();
    await db.insert(schema.dateVoteResponses).values(responses).onConflictDoUpdate({
      target: [schema.dateVoteResponses.slotId, schema.dateVoteResponses.participantId],
      set: { response: sql_excluded('response'), updatedAt: new Date() },
    });
    log(`✓ date_vote: polls ${polls.length}, slots ${slots.length}, responses ${responses.length}`);
  }

  if (eventLocations.length) {
    await db.insert(schema.eventLocations).values(eventLocations).onConflictDoNothing();
    log(`✓ event_locations: ${eventLocations.length}건`);
  }
  if (photos.length) {
    await db.insert(schema.photos).values(photos).onConflictDoUpdate({
      target: schema.photos.id,
      set: { imageKey: sql_excluded('image_key'), exifMetadata: sql_excluded('exif_metadata'), updatedAt: new Date() },
    });
    log(`✓ photos: ${photos.length}건`);
  }

  log('완료!');
  await client.end();
}

main().catch((err: unknown) => {
  const e = err as { message?: string; detail?: string; constraint?: string; code?: string };
  process.stderr.write('[esther-seed] 오류 발생\n');
  if (e.code) process.stderr.write(`  code: ${e.code}\n`);
  if (e.detail) process.stderr.write(`  detail: ${e.detail}\n`);
  if (e.constraint) process.stderr.write(`  constraint: ${e.constraint}\n`);
  process.stderr.write(`  message: ${(e.message ?? String(err)).slice(0, 500)}\n`);
  process.exit(1);
});

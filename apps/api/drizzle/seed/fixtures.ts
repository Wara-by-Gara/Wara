import { createHash } from 'crypto';

// ── Deterministic Crockford Base32 ID from SHA-256 ───────────────────────────
// 동일 seed → 항상 동일 26자 ULID-compatible 문자열 (재실행 idempotency)

const CROCKFORD = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

export function id(seed: string): string {
  const hash = createHash('sha256').update(`wara-seed:${seed}`).digest();
  let result = '';
  let buf = 0;
  let bits = 0;
  for (let i = 0; i < hash.length && result.length < 26; i++) {
    // hash[i]는 Buffer 인덱스 접근 — 범위 내 보장
    buf = (buf << 8) | hash[i]!;
    bits += 8;
    while (bits >= 5 && result.length < 26) {
      bits -= 5;
      // (buf >> bits) & 0x1f 는 항상 0-31 범위
      result += CROCKFORD[(buf >> bits) & 0x1f]!;
    }
  }
  return result;
}

// ── Static definitions ───────────────────────────────────────────────────────

type Provider = 'kakao' | 'naver' | 'apple';
type Gender = 'female' | 'male';
type Role = 'member' | 'admin';
type InvStatus = 'active' | 'closed';
type RsvpStatus = 'attending' | 'undecided' | 'absent' | 'cancelled';

const USER_DEFS: Array<{
  key: string;
  name: string;
  nickname: string;
  email: string;
  gender: Gender;
  birthYear: number;
  role: Role;
  provider: Provider;
}> = [
  { key: 'host1',   name: '김지원',     nickname: '지원',   email: 'host1@wara.dev',   gender: 'female', birthYear: 1992, role: 'member', provider: 'kakao' },
  { key: 'host2',   name: '이민준',     nickname: '민준',   email: 'host2@wara.dev',   gender: 'male',   birthYear: 1988, role: 'member', provider: 'naver' },
  { key: 'host3',   name: '박소현',     nickname: '소현',   email: 'host3@wara.dev',   gender: 'female', birthYear: 1995, role: 'member', provider: 'apple' },
  { key: 'host4',   name: '최준혁',     nickname: '준혁',   email: 'host4@wara.dev',   gender: 'male',   birthYear: 1990, role: 'member', provider: 'kakao' },
  { key: 'guest01', name: '오하은',     nickname: '하은',   email: 'guest01@wara.dev', gender: 'female', birthYear: 1998, role: 'member', provider: 'kakao' },
  { key: 'guest02', name: '정우석',     nickname: '우석',   email: 'guest02@wara.dev', gender: 'male',   birthYear: 1996, role: 'member', provider: 'naver' },
  { key: 'guest03', name: '한수아',     nickname: '수아',   email: 'guest03@wara.dev', gender: 'female', birthYear: 2000, role: 'member', provider: 'apple' },
  { key: 'guest04', name: '윤태양',     nickname: '태양',   email: 'guest04@wara.dev', gender: 'male',   birthYear: 1994, role: 'member', provider: 'kakao' },
  { key: 'guest05', name: '임나연',     nickname: '나연',   email: 'guest05@wara.dev', gender: 'female', birthYear: 1999, role: 'member', provider: 'naver' },
  { key: 'guest06', name: '신동현',     nickname: '동현',   email: 'guest06@wara.dev', gender: 'male',   birthYear: 1993, role: 'member', provider: 'apple' },
  { key: 'guest07', name: '류지아',     nickname: '지아',   email: 'guest07@wara.dev', gender: 'female', birthYear: 2001, role: 'member', provider: 'kakao' },
  { key: 'guest08', name: '황민서',     nickname: '민서',   email: 'guest08@wara.dev', gender: 'male',   birthYear: 1997, role: 'member', provider: 'naver' },
  { key: 'guest09', name: '조예린',     nickname: '예린',   email: 'guest09@wara.dev', gender: 'female', birthYear: 1995, role: 'member', provider: 'apple' },
  { key: 'guest10', name: '강준서',     nickname: '준서',   email: 'guest10@wara.dev', gender: 'male',   birthYear: 1992, role: 'member', provider: 'kakao' },
  { key: 'guest11', name: '백아름',     nickname: '아름',   email: 'guest11@wara.dev', gender: 'female', birthYear: 2003, role: 'member', provider: 'naver' },
  { key: 'guest12', name: '전성우',     nickname: '성우',   email: 'guest12@wara.dev', gender: 'male',   birthYear: 1991, role: 'member', provider: 'apple' },
  { key: 'guest13', name: '변채원',     nickname: '채원',   email: 'guest13@wara.dev', gender: 'female', birthYear: 1999, role: 'member', provider: 'kakao' },
  { key: 'guest14', name: '서민호',     nickname: '민호',   email: 'guest14@wara.dev', gender: 'male',   birthYear: 1996, role: 'member', provider: 'naver' },
  { key: 'admin',   name: '관리자',     nickname: '관리자', email: 'admin@wara.dev',   gender: 'male',   birthYear: 1985, role: 'admin',  provider: 'kakao' },
  { key: 'blocked', name: '차단된유저', nickname: '차단됨', email: 'blocked@wara.dev', gender: 'female', birthYear: 2000, role: 'member', provider: 'naver' },
];

const TEMPLATE_DEFS = [
  { key: 'tmpl1', name: '봄 파티',  theme: 'bloom',   font: 'serif',   effect: 'confetti', isActive: true },
  { key: 'tmpl2', name: '미니멀',   theme: 'minimal', font: 'sans',    effect: null,       isActive: true },
  { key: 'tmpl3', name: '레트로',   theme: 'retro',   font: 'mono',    effect: 'sparkle',  isActive: true },
  { key: 'tmpl4', name: '다크',     theme: 'dark',    font: 'display', effect: null,       isActive: false },
];

const INV_DEFS: Array<{
  key: string;
  hostKey: string;
  status: InvStatus;
  isMissionEnabled: boolean;
  templateKey: string | null;
  title: string;
  description: string;
  eventStartAt: Date;
}> = [
  { key: 'inv01', hostKey: 'host1', status: 'active', isMissionEnabled: true,  templateKey: 'tmpl1', title: '지원이의 생일 파티',    description: '소중한 친구들과 함께하는 특별한 생일 파티입니다. 많이 와주세요!',     eventStartAt: new Date('2026-06-20T14:00:00Z') },
  { key: 'inv02', hostKey: 'host1', status: 'active', isMissionEnabled: false, templateKey: 'tmpl2', title: '봄맞이 한강 피크닉',     description: '봄을 맞이해 한강에서 즐거운 시간 보내요. 자유롭게 참석해 주세요.',  eventStartAt: new Date('2026-07-05T11:00:00Z') },
  { key: 'inv03', hostKey: 'host2', status: 'active', isMissionEnabled: true,  templateKey: 'tmpl3', title: '민준이 승진 축하 파티',   description: '민준이의 승진을 함께 축하해 주세요!',                                  eventStartAt: new Date('2026-06-28T18:00:00Z') },
  { key: 'inv04', hostKey: 'host2', status: 'closed', isMissionEnabled: false, templateKey: null,    title: '팀 워크숍 2026',          description: '2026년 상반기 팀 워크숍입니다.',                                        eventStartAt: new Date('2026-03-15T14:00:00Z') },
  { key: 'inv05', hostKey: 'host3', status: 'active', isMissionEnabled: true,  templateKey: 'tmpl1', title: '소현이 결혼 준비 파티',   description: '소현이의 결혼을 앞두고 친구들과 함께하는 파티입니다.',                 eventStartAt: new Date('2026-07-12T13:00:00Z') },
  { key: 'inv06', hostKey: 'host3', status: 'active', isMissionEnabled: false, templateKey: 'tmpl2', title: '제주도 여름 여행',         description: '제주도로 여행을 떠나요. 멋진 추억을 만들어 봐요!',                     eventStartAt: new Date('2026-08-01T10:00:00Z') },
  { key: 'inv07', hostKey: 'host4', status: 'active', isMissionEnabled: true,  templateKey: 'tmpl3', title: '준혁이 독립 기념 파티',   description: '새 집으로 이사한 준혁이를 함께 축하해 주세요!',                        eventStartAt: new Date('2026-06-25T15:00:00Z') },
  { key: 'inv08', hostKey: 'host4', status: 'active', isMissionEnabled: false, templateKey: 'tmpl4', title: '여름 바비큐 파티',         description: '뜨거운 여름, 시원한 바비큐 파티를 즐겨요.',                            eventStartAt: new Date('2026-07-20T12:00:00Z') },
  { key: 'inv09', hostKey: 'host1', status: 'closed', isMissionEnabled: false, templateKey: 'tmpl1', title: '신입 팀원 환영회',         description: '새로운 팀원을 환영합니다. 함께 즐거운 시간 보내요!',                   eventStartAt: new Date('2026-02-14T18:00:00Z') },
  { key: 'inv10', hostKey: 'host2', status: 'active', isMissionEnabled: true,  templateKey: 'tmpl2', title: '2026 여름 워터파크',       description: '올 여름 가장 시원한 워터파크 파티!',                                   eventStartAt: new Date('2026-08-10T09:00:00Z') },
];

// HOST 첫 번째, GUEST 이후
const INV_PARTICIPANT_KEYS: [string, string[]][] = [
  ['inv01', ['host1', 'guest01', 'guest02', 'guest03', 'guest04', 'guest05', 'guest06', 'guest07']],
  ['inv02', ['host1', 'guest02', 'guest03', 'guest04']],
  ['inv03', ['host2', 'guest05', 'guest06', 'guest07', 'guest08']],
  ['inv04', ['host2', 'guest06', 'guest07', 'guest08']],
  ['inv05', ['host3', 'guest09', 'guest10', 'guest11', 'guest12']],
  ['inv06', ['host3', 'guest10', 'guest11', 'guest12']],
  ['inv07', ['host4', 'guest13', 'guest14', 'guest01', 'guest02']],
  ['inv08', ['host4', 'guest03', 'guest04', 'guest05']],
  ['inv09', ['host1', 'guest06', 'guest07']],
  ['inv10', ['host2', 'guest08', 'guest09', 'guest10', 'guest11', 'guest12']],
];

// index 0=HOST → always 'attending', index 1..7 → rsvp 패턴
const RSVP_BY_IDX: RsvpStatus[] = [
  'attending', 'attending', 'attending', 'undecided',
  'absent',    'attending', 'cancelled', 'attending',
];

type LocationDef = {
  address: string; placeName: string; detailAddress: string;
  lat: number; lng: number; placeId: string;
};

const EVENT_LOCATION_DEFS: Record<string, LocationDef> = {
  inv01: { placeName: '강남 파티룸',       address: '서울 강남구 역삼동',       detailAddress: '역삼동 파티룸 3F',  lat: 37.4979, lng: 127.0276, placeId: 'place-inv01' },
  inv02: { placeName: '한강공원 여의도',   address: '서울 영등포구 여의도동',   detailAddress: '여의도 한강공원',   lat: 37.5226, lng: 126.9345, placeId: 'place-inv02' },
  inv03: { placeName: '홍대 파티룸',       address: '서울 마포구 동교동',       detailAddress: '홍대 파티룸 2F',    lat: 37.5574, lng: 126.9248, placeId: 'place-inv03' },
  inv05: { placeName: '해운대 리조트',     address: '부산 해운대구 우동',       detailAddress: '해운대 비치 리조트', lat: 35.1587, lng: 129.1604, placeId: 'place-inv05' },
  inv06: { placeName: '제주 펜션',         address: '제주특별자치도 서귀포시',  detailAddress: '서귀포 바다 펜션',  lat: 33.2541, lng: 126.5601, placeId: 'place-inv06' },
  inv07: { placeName: '이태원 파티룸',     address: '서울 용산구 이태원동',     detailAddress: '이태원 파티룸 1F',  lat: 37.5344, lng: 126.9940, placeId: 'place-inv07' },
  inv08: { placeName: '용인 바비큐 파크',  address: '경기도 용인시 처인구',     detailAddress: '용인 BBQ 파크',     lat: 37.2411, lng: 127.1775, placeId: 'place-inv08' },
  inv10: { placeName: '잠실 파티룸',       address: '서울 송파구 잠실동',       detailAddress: '잠실 루프탑 파티룸', lat: 37.5148, lng: 127.1000, placeId: 'place-inv10' },
};

// 호스트가 모임에 추가할 수 있는 공용 미션 카탈로그 (admin 시드)
const MISSION_TEMPLATE_DEFS: Array<{ key: string; content: string; isActive: boolean }> = [
  { key: 'mt01', content: '모임 전체 단체 사진 1장 찍기', isActive: true },
  { key: 'mt02', content: '가장 맛있어 보이는 음식 사진 올리기', isActive: true },
  { key: 'mt03', content: '옆 사람과 셀카 찍기', isActive: true },
  { key: 'mt04', content: '오늘의 BEST 순간 인증샷', isActive: true },
  { key: 'mt05', content: '시그니처 포즈로 사진 한 컷', isActive: true },
  { key: 'mt06', content: '모임 장소의 풍경/배경 사진', isActive: true },
  { key: 'mt07', content: '다 함께 점프 사진 도전', isActive: true },
  { key: 'mt08', content: '손 모양 하트 인증샷', isActive: true },
  { key: 'mt09', content: '이모지로 표현하는 오늘의 기분 사진', isActive: true },
  { key: 'mt10', content: '오늘 모임의 추억 한 컷 남기기', isActive: true },
];

const MISSION_DEFS: Record<string, Array<{ participantKey: string; content: string }>> = {
  inv01: [
    { participantKey: 'guest01', content: '가장 웃긴 표정으로 단체 사진 찍기' },
    { participantKey: 'guest02', content: '처음 만난 사람과 셀카 찍기' },
    { participantKey: 'guest03', content: '케이크 촛불 끄는 순간 포착하기' },
  ],
  inv03: [
    { participantKey: 'guest05', content: '주인공에게 감동적인 한마디 영상으로 남기기' },
    { participantKey: 'guest06', content: '파티의 하이라이트 순간 포착하기' },
  ],
  inv05: [
    { participantKey: 'guest09', content: '신부 퀴즈 통과하기' },
    { participantKey: 'guest10', content: '웨딩 드레스 체험 인증샷' },
  ],
  inv07: [
    { participantKey: 'guest13', content: '새 집 투어 영상 찍기' },
    { participantKey: 'guest14', content: '집들이 음식 미션 달성' },
  ],
  inv10: [
    { participantKey: 'guest08', content: '워터 슬라이드 도전 인증샷' },
    { participantKey: 'guest09', content: '물 싸움 우승하기' },
    { participantKey: 'guest10', content: '워터파크 모든 시설 이용 인증' },
  ],
};

// photo index 0..14 의 like count 패턴 (합=22)
const PHOTO_LIKE_PATTERN = [2, 3, 1, 2, 3, 0, 1, 2, 1, 3, 0, 1, 2, 0, 1];

// feedback index 0..11 의 like count 패턴 (합=11)
// [inv0, inv1, inv2, inv3, photo0, photo1, photo2, photo3, reply0, reply1, deleted, extra]
const FEEDBACK_LIKE_PATTERN = [2, 1, 3, 0, 1, 2, 0, 1, 0, 1, 0, 0];

const FEEDBACK_CONTENTS_INV = [
  '정말 재미있는 파티였어요!',
  '다음에 또 이런 모임 해요',
  '와줘서 정말 고마워요 :)',
  '오늘 최고의 날이에요!',
];
const FEEDBACK_CONTENTS_PHOTO = [
  '이 사진 진짜 잘 나왔다!',
  '추억이다 ㅠㅠ 소중해요',
  '최고의 순간이네요',
  '다시 보니까 너무 좋다',
  '이 순간 기억에 남을 것 같아요',
];

// ── Seed builder ─────────────────────────────────────────────────────────────

function buildSeeds() {
  // 1. User IDs
  const userIdByKey: Record<string, string> = {};
  for (const u of USER_DEFS) userIdByKey[u.key] = id(`user:${u.key}`);

  // 2. Users
  const users = USER_DEFS.map((u) => ({
    id: userIdByKey[u.key]!,
    email: u.email,
    profileImageUrl: null as string | null,
    name: u.name,
    nickname: u.nickname,
    birthYear: u.birthYear,
    gender: u.gender,
    role: u.role,
    lastLoginAt: new Date('2026-05-01T09:00:00Z'),
  }));

  // 3. Social accounts (kakao/naver/apple only — V1.0)
  const socialAccounts = USER_DEFS.map((u) => ({
    id: id(`social:${u.key}`),
    userId: userIdByKey[u.key]!,
    provider: u.provider,
    providerAccountId: `${u.provider}-${u.key}-id`,
    rawProfile: { name: u.name, email: u.email } as Record<string, string>,
    appleRefreshToken: u.provider === 'apple' ? `apple-refresh-${u.key}` : null as string | null,
    isPrivateEmail: u.provider === 'apple',
  }));

  // 4. Notification settings (1:1 per user)
  const notificationSettings = USER_DEFS.map((u) => ({
    id: id(`notif-settings:${u.key}`),
    userId: userIdByKey[u.key]!,
    isRemind: true,
    isFeedback: true,
    isInvitationDate: true,
    isPhoto: true,
    isMission: true,
    isParticipantLocations: true,
    isEventLocations: true,
  }));

  // 5. Templates
  const templateIdByKey: Record<string, string> = {};
  for (const t of TEMPLATE_DEFS) templateIdByKey[t.key] = id(`template:${t.key}`);

  const templates = TEMPLATE_DEFS.map((t) => ({
    id: templateIdByKey[t.key]!,
    name: t.name,
    previewImageKey: `seed/templates/${t.theme}.jpg`,
    theme: t.theme,
    font: t.font,
    effect: t.effect,
    isActive: t.isActive,
  }));

  // 5-1. Mission Templates (admin 시드, invitation 무관)
  const missionTemplates = MISSION_TEMPLATE_DEFS.map((mt) => ({
    id: id(`missionTemplate:${mt.key}`),
    content: mt.content,
    isActive: mt.isActive,
  }));

  // 6. Invitations
  const invIdByKey: Record<string, string> = {};
  for (const inv of INV_DEFS) invIdByKey[inv.key] = id(`invitation:${inv.key}`);

  const invitations = INV_DEFS.map((inv) => ({
    id: invIdByKey[inv.key]!,
    userId: userIdByKey[inv.hostKey]!,
    templateId: inv.templateKey ? templateIdByKey[inv.templateKey]! : null as string | null,
    status: inv.status,
    title: inv.title,
    description: inv.description,
    mainImageKey: `seed/invitations/${inv.key}/main.jpg`,
    eventStartAt: inv.eventStartAt,
    isMissionEnabled: inv.isMissionEnabled,
  }));

  // 7. Participants + participant ID map
  const partIdByKey: Record<string, Record<string, string>> = {};
  const participants: Array<{
    id: string; userId: string; invitationId: string;
    memberRole: 'HOST' | 'GUEST'; rsvpStatus: RsvpStatus;
  }> = [];

  for (const [invKey, userKeys] of INV_PARTICIPANT_KEYS) {
    partIdByKey[invKey] = {};
    for (let idx = 0; idx < userKeys.length; idx++) {
      const uKey = userKeys[idx]!;
      const pId = id(`participant:${invKey}:${uKey}`);
      partIdByKey[invKey]![uKey] = pId;
      participants.push({
        id: pId,
        userId: userIdByKey[uKey]!,
        invitationId: invIdByKey[invKey]!,
        memberRole: idx === 0 ? 'HOST' : 'GUEST',
        rsvpStatus: RSVP_BY_IDX[idx] ?? 'attending',
      });
    }
  }

  // 8. Event locations
  const eventLocations = Object.entries(EVENT_LOCATION_DEFS).map(([invKey, loc]) => ({
    id: id(`eventloc:${invKey}`),
    invitationId: invIdByKey[invKey]!,
    address: loc.address,
    placeName: loc.placeName,
    detailAddress: loc.detailAddress,
    lat: loc.lat,
    lng: loc.lng,
    placeId: loc.placeId,
  }));

  // 9. Send logs (2 per invitation)
  const sendLogs = INV_PARTICIPANT_KEYS.flatMap(([invKey, userKeys]) => {
    const hostUserId = userIdByKey[userKeys[0]!]!;
    const invId = invIdByKey[invKey]!;
    const baseUrl = `https://wara.dev/invite/${invId}`;
    return [
      { id: id(`sendlog:${invKey}:0`), invitationId: invId, senderId: hostUserId, channel: 'kakao' as const, inviteUrl: baseUrl, status: 'responded' as const },
      { id: id(`sendlog:${invKey}:1`), invitationId: invId, senderId: hostUserId, channel: 'link'  as const, inviteUrl: baseUrl, status: 'opened'   as const },
    ];
  });

  // 10. Blocklists (inv01: active 1건 + soft-deleted 1건)
  const blocklists = [
    {
      id: id('blocklist:inv01:active'),
      invitationId: invIdByKey['inv01']!,
      blockedUserId: userIdByKey['blocked']!,
      blockedByUserId: userIdByKey['host1']!,
      deletedAt: null as Date | null,
    },
    {
      id: id('blocklist:inv01:deleted'),
      invitationId: invIdByKey['inv01']!,
      blockedUserId: userIdByKey['guest05']!,
      blockedByUserId: userIdByKey['host1']!,
      deletedAt: new Date('2026-03-01T12:00:00Z'),
    },
  ];

  // 11. Participant locations (attending non-host participants with event location)
  const participantLocations = Object.entries(EVENT_LOCATION_DEFS).flatMap(([invKey, loc]) => {
    const targetInvId = invIdByKey[invKey]!;
    const attendingGuests = participants.filter(
      (p) => p.invitationId === targetInvId && p.memberRole === 'GUEST' && p.rsvpStatus === 'attending',
    );
    return attendingGuests.map((p, ai) => ({
      id: id(`partloc:${invKey}:${p.id}`),
      invitationId: targetInvId,
      participantId: p.id,
      accuracy: 5.0 + ai * 2.5,
      lat: loc.lat + (ai === 0 ? 0.0001 : 0.005 * (ai + 1)),
      lng: loc.lng + (ai === 0 ? 0.0001 : 0.005 * (ai + 1)),
      isArrived: ai === 0,
    }));
  });

  // 12. Missions
  const missions = Object.entries(MISSION_DEFS).flatMap(([invKey, defs]) =>
    defs.map((def, mi) => ({
      id: id(`mission:${invKey}:${mi}`),
      invitationId: invIdByKey[invKey]!,
      participantId: partIdByKey[invKey]![def.participantKey]!,
      content: def.content,
    })),
  );

  // 13. Photos (15 per invitation) + photo_likes
  const photos: Array<{
    id: string; participantId: string; invitationId: string;
    imageKey: string; exifMetadata: Record<string, unknown>;
    viewCount: number; likeCount: number; deletedAt: Date | null;
  }> = [];
  const photoLikes: Array<{ id: string; photoId: string; participantId: string }> = [];
  const photoIdsByInv: Record<string, string[]> = {};

  for (const [invKey, userKeys] of INV_PARTICIPANT_KEYS) {
    const pIds = userKeys.map((uk) => partIdByKey[invKey]![uk]!);
    photoIdsByInv[invKey] = [];

    for (let i = 0; i < 15; i++) {
      const photoId = id(`photo:${invKey}:${i}`);
      photoIdsByInv[invKey]!.push(photoId);

      const uploaderId = pIds[i % pIds.length]!;
      const isSoftDeleted = invKey === 'inv06' && i === 14;
      const others = pIds.filter((p) => p !== uploaderId);
      const likerCount = isSoftDeleted ? 0 : Math.min(PHOTO_LIKE_PATTERN[i]!, others.length);
      const startIdx = others.length > 0 ? i % others.length : 0;
      const likers = [...others.slice(startIdx), ...others.slice(0, startIdx)].slice(0, likerCount);

      photos.push({
        id: photoId,
        participantId: uploaderId,
        invitationId: invIdByKey[invKey]!,
        imageKey: `seed/photos/${invKey}/photo-${String(i + 1).padStart(2, '0')}.jpg`,
        exifMetadata: {
          width: 1920, height: 1080,
          takenAt: `2026-04-${String((i % 28) + 1).padStart(2, '0')}T${String(10 + (i % 10)).padStart(2, '0')}:00:00Z`,
          camera: 'iPhone 15',
        },
        viewCount: 0,
        likeCount: likers.length,
        deletedAt: isSoftDeleted ? new Date('2026-04-20T12:00:00Z') : null,
      });

      likers.forEach((likerId, li) => {
        photoLikes.push({ id: id(`photolike:${invKey}:${i}:${li}`), photoId, participantId: likerId });
      });
    }
  }

  // 14. Feedbacks (12 per invitation: 4 inv + 4 photo + 2 reply + 1 deleted + 1 extra) + feedback_likes
  const feedbacks: Array<{
    id: string; participantId: string;
    invitationId: string | null; photoId: string | null; parentId: string | null;
    content: string; likeCount: number; isDeleted: boolean; deletedAt: Date | null;
  }> = [];
  const feedbackLikes: Array<{ id: string; feedbackId: string; participantId: string }> = [];

  for (const [invKey, userKeys] of INV_PARTICIPANT_KEYS) {
    const pIds = userKeys.map((uk) => partIdByKey[invKey]![uk]!);
    const invId = invIdByKey[invKey]!;
    const invPhotos = photoIdsByInv[invKey]!;

    const fbInvIds: string[] = [];
    const fbPhotoIds: string[] = [];

    // 4 invitation-level feedbacks
    for (let i = 0; i < 4; i++) {
      const fbId = id(`feedback:${invKey}:inv:${i}`);
      fbInvIds.push(fbId);
      const authorId = pIds[(i + 1) % pIds.length]!;
      const others = pIds.filter((p) => p !== authorId);
      const likerCount = Math.min(FEEDBACK_LIKE_PATTERN[i]!, others.length);
      const likers = others.slice(0, likerCount);

      feedbacks.push({ id: fbId, participantId: authorId, invitationId: invId, photoId: null, parentId: null, content: FEEDBACK_CONTENTS_INV[i]!, likeCount: likers.length, isDeleted: false, deletedAt: null });
      likers.forEach((lId, li) => feedbackLikes.push({ id: id(`fblike:${invKey}:inv:${i}:${li}`), feedbackId: fbId, participantId: lId }));
    }

    // 4 photo-level feedbacks
    for (let i = 0; i < 4; i++) {
      const fbId = id(`feedback:${invKey}:photo:${i}`);
      fbPhotoIds.push(fbId);
      const authorId = pIds[(i + 2) % pIds.length]!;
      const others = pIds.filter((p) => p !== authorId);
      const likerCount = Math.min(FEEDBACK_LIKE_PATTERN[i + 4]!, others.length);
      const likers = others.slice(0, likerCount);

      feedbacks.push({ id: fbId, participantId: authorId, invitationId: null, photoId: invPhotos[i]!, parentId: null, content: FEEDBACK_CONTENTS_PHOTO[i]!, likeCount: likers.length, isDeleted: false, deletedAt: null });
      likers.forEach((lId, li) => feedbackLikes.push({ id: id(`fblike:${invKey}:photo:${i}:${li}`), feedbackId: fbId, participantId: lId }));
    }

    // Reply 0 → inv feedback[0]
    feedbacks.push({
      id: id(`feedback:${invKey}:reply:0`),
      participantId: pIds[3 % pIds.length]!,
      invitationId: invId, photoId: null, parentId: fbInvIds[0]!,
      content: '맞아요 완전 동의!', likeCount: 0, isDeleted: false, deletedAt: null,
    });

    // Reply 1 → photo feedback[0]
    const r1Author = pIds[4 % pIds.length]!;
    const r1Others = pIds.filter((p) => p !== r1Author);
    const r1LikerCount = Math.min(FEEDBACK_LIKE_PATTERN[9]!, r1Others.length);
    const r1Likers = r1Others.slice(0, r1LikerCount);
    const r1Id = id(`feedback:${invKey}:reply:1`);
    feedbacks.push({
      id: r1Id,
      participantId: r1Author,
      invitationId: null, photoId: invPhotos[0]!, parentId: fbPhotoIds[0]!,
      content: '저도 그렇게 생각해요', likeCount: r1Likers.length, isDeleted: false, deletedAt: null,
    });
    r1Likers.forEach((lId, li) => feedbackLikes.push({ id: id(`fblike:${invKey}:reply:1:${li}`), feedbackId: r1Id, participantId: lId }));

    // Soft-deleted feedback
    feedbacks.push({
      id: id(`feedback:${invKey}:deleted:0`),
      participantId: pIds[1 % pIds.length]!,
      invitationId: invId, photoId: null, parentId: null,
      content: '(삭제된 댓글입니다)', likeCount: 0, isDeleted: true, deletedAt: new Date('2026-04-10T12:00:00Z'),
    });

    // Extra photo feedback
    feedbacks.push({
      id: id(`feedback:${invKey}:photo:4`),
      participantId: pIds[0]!,
      invitationId: null, photoId: invPhotos[4]!, parentId: null,
      content: FEEDBACK_CONTENTS_PHOTO[4]!, likeCount: 0, isDeleted: false, deletedAt: null,
    });
  }

  // 15. Notifications (3 per invitation)
  const notifications = INV_PARTICIPANT_KEYS.flatMap(([invKey, userKeys]) => {
    const inv = INV_DEFS.find((i) => i.key === invKey)!;
    const hostUserId = userIdByKey[inv.hostKey]!;
    const secondUserKey = (userKeys[1] ?? userKeys[0])!;
    const invPhotos = photoIdsByInv[invKey]!;
    const firstFbId = id(`feedback:${invKey}:inv:0`);

    return [
      {
        id: id(`notif:${invKey}:photo`),
        userId: hostUserId,
        actorUserId: userIdByKey[secondUserKey]!,
        type: 'photo' as const,
        content: '새로운 사진이 업로드되었어요',
        targetType: 'photo' as const,
        targetId: invPhotos[0]!,
        isRead: false,
        readAt: null as Date | null,
      },
      {
        id: id(`notif:${invKey}:feedback`),
        userId: hostUserId,
        actorUserId: userIdByKey[secondUserKey]!,
        type: 'feedback' as const,
        content: '새로운 댓글이 달렸어요',
        targetType: 'feedback' as const,
        targetId: firstFbId,
        isRead: false,
        readAt: null as Date | null,
      },
      {
        id: id(`notif:${invKey}:remind`),
        userId: userIdByKey[secondUserKey]!,
        actorUserId: null as string | null,
        type: 'remind' as const,
        content: '이벤트가 곧 시작돼요',
        targetType: null as null,
        targetId: null as null,
        isRead: true,
        readAt: new Date('2026-04-14T09:00:00Z'),
      },
    ];
  });

  return {
    users,
    socialAccounts,
    notificationSettings,
    templates,
    missionTemplates,
    invitations,
    participants,
    eventLocations,
    sendLogs,
    blocklists,
    participantLocations,
    missions,
    photos,
    photoLikes,
    feedbacks,
    feedbackLikes,
    notifications,
  };
}

export const SEEDS = buildSeeds();

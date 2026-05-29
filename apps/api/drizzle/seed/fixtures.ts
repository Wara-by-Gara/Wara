import { createHash } from 'crypto';
import { fakerKO as faker } from '@faker-js/faker';

// ── Deterministic Crockford Base32 ID from SHA-256 ───────────────────────────
// 동일 seed → 항상 동일 26자 ULID-compatible 문자열 (재실행 idempotency)

const CROCKFORD = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

export function id(seed: string): string {
  const hash = createHash('sha256').update(`wara-seed:${seed}`).digest();
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

// ── faker 시드 고정 (재현성 보장) ────────────────────────────────────────────
faker.seed(20260527);

// ── 외부 placeholder 이미지 URL 생성기 ───────────────────────────────────────
// S3Service가 'http(s)://' prefix를 그대로 패스스루하도록 수정되어 있음.
const profileAvatarUrl = (seedKey: string) =>
  `https://i.pravatar.cc/300?u=${encodeURIComponent(seedKey)}`;
const invitationCoverUrl = (seedKey: string) =>
  `https://picsum.photos/seed/${encodeURIComponent(seedKey)}/1024/576`;
const photoUrl = (seedKey: string) =>
  `https://picsum.photos/seed/${encodeURIComponent(seedKey)}/1280/853`;
const templatePreviewUrl = (seedKey: string) =>
  `https://picsum.photos/seed/${encodeURIComponent(seedKey)}/600/400`;

// ── 규모 ─────────────────────────────────────────────────────────────────────
const HOST_COUNT = 40;
const GUEST_COUNT = 160;
const INVITATION_COUNT = 100;
const PHOTOS_PER_INVITATION = 15;
const INQUIRY_COUNT = 80;
const MISSION_TEMPLATE_COUNT = 30;

// ── Static enums / 카탈로그 ──────────────────────────────────────────────────
type Provider = 'kakao' | 'naver' | 'apple';
type Gender = 'female' | 'male';
type Role = 'member' | 'admin';
type InvStatus = 'active' | 'closed';
type RsvpStatus = 'attending' | 'undecided' | 'absent';
type InquiryType =
  | 'invitation' | 'photo' | 'notification' | 'mission'
  | 'bug' | 'feature' | 'general';
type InquiryStatus = 'pending' | 'in_progress' | 'resolved';

const PROVIDERS: Provider[] = ['kakao', 'naver', 'apple'];
const GENDERS: Gender[] = ['female', 'male'];
const RSVP_PATTERN: RsvpStatus[] = [
  'attending', 'attending', 'undecided', 'absent', 'attending', 'attending', 'absent', 'undecided',
];
const SEND_CHANNELS = ['kakao', 'link', 'sms', 'instagram'] as const;

const INV_TITLES = [
  '생일 파티', '집들이', '결혼 준비 파티', '승진 축하 모임', '여름 휴가 모임',
  '한강 피크닉', '바비큐 파티', '워크숍', '동창회', '송년회',
  '신년회', '벚꽃 나들이', '캠핑 모임', '독서 모임', '게임 나잇',
  '럭셔리 디너', '신입 환영회', '졸업 축하 파티', '루프탑 칵테일', '주말 브런치',
];

const FEEDBACK_INV_TEMPLATES = [
  '정말 재미있는 모임이었어요!', '다음에 또 이런 모임 해요',
  '와줘서 정말 고마워요 :)', '오늘 최고의 날이에요!',
  '추억 가득한 시간이었어요', '함께해서 즐거웠습니다',
  '잊지 못할 하루였어요', '다음에는 더 멋지게 준비해볼게요',
];
const FEEDBACK_PHOTO_TEMPLATES = [
  '이 사진 진짜 잘 나왔다!', '추억이다 ㅠㅠ 소중해요',
  '최고의 순간이네요', '다시 보니까 너무 좋다',
  '이 순간 기억에 남을 것 같아요', '구도 미쳤네',
  '인생샷이다', '여기 어디예요?',
];
const REPLY_TEMPLATES = [
  '맞아요 완전 동의!', '저도 그렇게 생각해요',
  '🤍🤍🤍', '동의합니다', '진짜요 ㅠㅠ',
];

const MISSION_CONTENT_BASE = [
  '단체 사진 찍기', '셀카 한 장 남기기', '오늘의 BEST 순간 인증샷',
  '시그니처 포즈로 사진 한 컷', '장소의 풍경 사진', '점프 사진 도전',
  '하트 인증샷', '가장 맛있는 음식 사진', '음식과 함께 셀카',
  '주인공과 사진', '단체 영상 5초 찍기', '함께 건배 사진',
];

const TEMPLATE_DEFS = [
  { key: 'tmpl1', name: '봄 파티',  theme: 'bloom',   font: 'serif',   effect: 'confetti', isActive: true },
  { key: 'tmpl2', name: '미니멀',   theme: 'minimal', font: 'sans',    effect: null,       isActive: true },
  { key: 'tmpl3', name: '레트로',   theme: 'retro',   font: 'mono',    effect: 'sparkle',  isActive: true },
  { key: 'tmpl4', name: '다크',     theme: 'dark',    font: 'display', effect: null,       isActive: false },
] as const;

// ── 유틸 ────────────────────────────────────────────────────────────────────
function pick<T>(arr: readonly T[], i: number): T {
  return arr[i % arr.length]!;
}
function take<T>(arr: readonly T[], n: number, startIdx = 0): T[] {
  return Array.from({ length: n }, (_, i) => arr[(startIdx + i) % arr.length]!);
}

// ── 한국 이름 + 영문 nickname 풀 ─────────────────────────────────────────────
type NamePart = { ko: string; en: string };

const SURNAMES: NamePart[] = [
  { ko: '김', en: 'kim' }, { ko: '이', en: 'lee' }, { ko: '박', en: 'park' },
  { ko: '최', en: 'choi' }, { ko: '정', en: 'jung' }, { ko: '강', en: 'kang' },
  { ko: '조', en: 'cho' }, { ko: '윤', en: 'yoon' }, { ko: '장', en: 'jang' },
  { ko: '임', en: 'lim' }, { ko: '한', en: 'han' }, { ko: '오', en: 'oh' },
  { ko: '서', en: 'seo' }, { ko: '신', en: 'shin' }, { ko: '권', en: 'kwon' },
  { ko: '황', en: 'hwang' }, { ko: '안', en: 'ahn' }, { ko: '송', en: 'song' },
  { ko: '류', en: 'ryu' }, { ko: '전', en: 'jeon' }, { ko: '홍', en: 'hong' },
  { ko: '고', en: 'ko' }, { ko: '문', en: 'moon' }, { ko: '양', en: 'yang' },
  { ko: '손', en: 'son' }, { ko: '배', en: 'bae' }, { ko: '백', en: 'baek' },
  { ko: '허', en: 'heo' }, { ko: '유', en: 'yoo' }, { ko: '남', en: 'nam' },
  { ko: '심', en: 'sim' }, { ko: '노', en: 'noh' }, { ko: '하', en: 'ha' },
];

const COMPOUND_SURNAMES: NamePart[] = [
  { ko: '남궁', en: 'namgung' },
  { ko: '황보', en: 'hwangbo' },
  { ko: '선우', en: 'sunwoo' },
  { ko: '제갈', en: 'jegal' },
];

const GIVEN_NAMES: NamePart[] = [
  { ko: '지원', en: 'jiwon' }, { ko: '민준', en: 'minjun' },
  { ko: '소현', en: 'sohyun' }, { ko: '준혁', en: 'junhyuk' },
  { ko: '하은', en: 'haeun' }, { ko: '우석', en: 'wooseok' },
  { ko: '수아', en: 'sua' }, { ko: '태양', en: 'taeyang' },
  { ko: '나연', en: 'nayeon' }, { ko: '동현', en: 'donghyun' },
  { ko: '지아', en: 'jia' }, { ko: '민서', en: 'minseo' },
  { ko: '예린', en: 'yerin' }, { ko: '준서', en: 'junseo' },
  { ko: '아름', en: 'areum' }, { ko: '성우', en: 'sungwoo' },
  { ko: '채원', en: 'chaewon' }, { ko: '민호', en: 'minho' },
  { ko: '도윤', en: 'doyoon' }, { ko: '시우', en: 'siwoo' },
  { ko: '하준', en: 'hajun' }, { ko: '지호', en: 'jiho' },
  { ko: '예준', en: 'yejun' }, { ko: '시윤', en: 'siyoon' },
  { ko: '주원', en: 'juwon' }, { ko: '지후', en: 'jihoo' },
  { ko: '윤서', en: 'yoonseo' }, { ko: '서준', en: 'seojun' },
  { ko: '도현', en: 'dohyun' }, { ko: '건우', en: 'gunwoo' },
  { ko: '시현', en: 'sihyun' }, { ko: '민재', en: 'minjae' },
  { ko: '정우', en: 'jungwoo' }, { ko: '재윤', en: 'jaeyoon' },
  { ko: '서연', en: 'seoyeon' }, { ko: '지윤', en: 'jiyoon' },
  { ko: '하윤', en: 'hayoon' }, { ko: '하린', en: 'harin' },
  { ko: '채은', en: 'chaeeun' }, { ko: '지유', en: 'jiyu' },
  { ko: '다인', en: 'dain' }, { ko: '예나', en: 'yena' },
  { ko: '수빈', en: 'subin' }, { ko: '가은', en: 'gaeun' },
  { ko: '시은', en: 'sieun' }, { ko: '다윤', en: 'dayoon' },
  { ko: '예원', en: 'yewon' }, { ko: '지안', en: 'jian' },
  { ko: '다은', en: 'daeun' }, { ko: '유나', en: 'yuna' },
  { ko: '윤지', en: 'yoonji' }, { ko: '다현', en: 'dahyun' },
  { ko: '은서', en: 'eunseo' }, { ko: '지율', en: 'jiyul' },
  { ko: '유진', en: 'yujin' }, { ko: '승우', en: 'seungwoo' },
  { ko: '이준', en: 'ijun' }, { ko: '윤우', en: 'yoonwoo' },
  { ko: '지환', en: 'jihwan' }, { ko: '연우', en: 'yeonwoo' },
];

/**
 * seedKey 기반으로 결정론적 한국 이름 + 영문 nickname 생성.
 * - name: 3글자(일반 성) 또는 4글자(복성, 약 10%)
 * - nickname: 영문 'given_surname' (snake_case, 20자 이내)
 */
function genName(seedKey: string): { name: string; nickname: string } {
  const hash = createHash('sha256').update(`name:${seedKey}`).digest();
  const useCompound = hash[2]! % 10 === 0;
  const surname = useCompound
    ? COMPOUND_SURNAMES[hash[0]! % COMPOUND_SURNAMES.length]!
    : SURNAMES[hash[0]! % SURNAMES.length]!;
  const given = GIVEN_NAMES[hash[1]! % GIVEN_NAMES.length]!;
  return {
    name: `${surname.ko}${given.ko}`,
    nickname: `${given.en}_${surname.en}`.slice(0, 20),
  };
}

// ── User 생성 ────────────────────────────────────────────────────────────────
type UserDef = {
  key: string;
  name: string;
  nickname: string;
  email: string;
  gender: Gender;
  birthYear: number;
  role: Role;
  provider: Provider;
};

function buildUserDefs(): UserDef[] {
  const defs: UserDef[] = [];

  for (let i = 0; i < HOST_COUNT; i++) {
    const num = String(i + 1).padStart(3, '0');
    const key = `host${num}`;
    const { name, nickname } = genName(key);
    defs.push({
      key,
      name,
      nickname,
      email: `host${num}@wara.dev`,
      gender: pick(GENDERS, i),
      birthYear: 1985 + (i % 18),
      role: 'member',
      provider: pick(PROVIDERS, i),
    });
  }

  for (let i = 0; i < GUEST_COUNT; i++) {
    const num = String(i + 1).padStart(3, '0');
    const key = `guest${num}`;
    const { name, nickname } = genName(key);
    defs.push({
      key,
      name,
      nickname,
      email: `guest${num}@wara.dev`,
      gender: pick(GENDERS, i + 1),
      birthYear: 1990 + (i % 15),
      role: 'member',
      provider: pick(PROVIDERS, i + 2),
    });
  }

  defs.push({
    key: 'admin',
    name: '관리자',
    nickname: '관리자',
    email: 'admin@wara.dev',
    gender: 'male',
    birthYear: 1985,
    role: 'admin',
    provider: 'kakao',
  });
  defs.push({
    key: 'blocked',
    name: '차단된유저',
    nickname: '차단됨',
    email: 'blocked@wara.dev',
    gender: 'female',
    birthYear: 2000,
    role: 'member',
    provider: 'naver',
  });

  return defs;
}

const USER_DEFS = buildUserDefs();
const HOST_KEYS = USER_DEFS.filter((u) => u.key.startsWith('host')).map((u) => u.key);
const GUEST_KEYS = USER_DEFS.filter((u) => u.key.startsWith('guest')).map((u) => u.key);

// ── Mission Template 카탈로그 ────────────────────────────────────────────────
const MISSION_TEMPLATE_DEFS = Array.from({ length: MISSION_TEMPLATE_COUNT }, (_, i) => ({
  key: `mt${String(i + 1).padStart(2, '0')}`,
  content: `${pick(MISSION_CONTENT_BASE, i)} ${i + 1}`,
  isActive: i % 10 !== 9, // 10개 중 1개는 비활성
}));

// ── Invitation 생성 ──────────────────────────────────────────────────────────
type InvDef = {
  key: string;
  hostKey: string;
  status: InvStatus;
  isMissionEnabled: boolean;
  templateKey: string | null;
  title: string;
  description: string;
  eventStartAt: Date;
  hasLocation: boolean;
};

const INV_DEFS: InvDef[] = Array.from({ length: INVITATION_COUNT }, (_, i) => {
  const num = String(i + 1).padStart(3, '0');
  const hostKey = HOST_KEYS[i % HOST_KEYS.length]!;
  const hostName = USER_DEFS.find((u) => u.key === hostKey)!.name;
  const isClosed = i % 10 === 8 || i % 10 === 9; // 20% closed
  const dayOffset = (i % 90) + 1;
  const baseDate = new Date('2026-06-01T10:00:00Z');
  const eventDate = new Date(baseDate.getTime() + dayOffset * 86_400_000);

  return {
    key: `inv${num}`,
    hostKey,
    status: isClosed ? 'closed' : 'active',
    isMissionEnabled: i % 3 === 0,
    templateKey: i % 5 === 4 ? null : pick(TEMPLATE_DEFS, i).key,
    title: `${hostName.replace(/\s.+/, '')}의 ${pick(INV_TITLES, i)}`,
    description: `${pick(INV_TITLES, i)}에 초대합니다. 즐거운 시간 보내요!`,
    eventStartAt: eventDate,
    hasLocation: i % 4 !== 3, // 75% 장소 등록
  };
});

// ── 각 Invitation의 Participant 명단 (HOST 첫 번째, 나머지 GUEST) ────────────
const INV_PARTICIPANT_KEYS: [string, string[]][] = INV_DEFS.map((inv, i) => {
  const guestCount = 4 + (i % 6); // 4~9명
  const guestStart = (i * 3) % GUEST_KEYS.length;
  const guests = take(GUEST_KEYS, guestCount, guestStart);
  return [inv.key, [inv.hostKey, ...guests]];
});

// ── Inquiry 생성 ─────────────────────────────────────────────────────────────
const INQUIRY_TYPES: InquiryType[] = [
  'invitation', 'photo', 'notification', 'mission',
  'bug', 'feature', 'general',
];
const INQUIRY_STATUSES: InquiryStatus[] = ['pending', 'in_progress', 'resolved'];

const INQUIRY_DEFS = Array.from({ length: INQUIRY_COUNT }, (_, i) => {
  const status = pick(INQUIRY_STATUSES, i);
  const isDeleted = i % 40 === 0;
  const userKey = i < HOST_KEYS.length ? HOST_KEYS[i]! : GUEST_KEYS[i % GUEST_KEYS.length]!;
  const inquiryType = pick(INQUIRY_TYPES, i);
  const answered = status !== 'pending';
  return {
    key: `inq${String(i + 1).padStart(3, '0')}`,
    userKey,
    inquiryType,
    status,
    title: `[${inquiryType}] ${faker.lorem.sentence({ min: 3, max: 6 })}`.slice(0, 200),
    content: faker.lorem.paragraph({ min: 1, max: 3 }),
    answer: answered ? '확인 후 회신 드렸습니다.' : null,
    answeredAt: answered ? new Date('2026-05-10T10:00:00Z') : null,
    adminAnswers: answered,
    deletedAt: isDeleted ? new Date('2026-05-01T08:00:00Z') : null,
  };
});

// 좋아요 패턴 (사진/피드백)
const PHOTO_LIKE_PATTERN = [2, 3, 1, 2, 3, 0, 1, 2, 1, 3, 0, 1, 2, 0, 1];
const FEEDBACK_LIKE_PATTERN = [2, 1, 3, 0, 1, 2, 0, 1, 0, 1, 0, 0];

// ── Seed builder ─────────────────────────────────────────────────────────────

function buildSeeds() {
  // 1. User IDs
  const userIdByKey: Record<string, string> = {};
  for (const u of USER_DEFS) userIdByKey[u.key] = id(`user:${u.key}`);

  // 2. Users (profileImageUrl: 외부 pravatar URL — S3 키 prefix 아니므로 그대로 반환됨)
  const users = USER_DEFS.map((u) => ({
    id: userIdByKey[u.key]!,
    email: u.email,
    profileImageUrl: profileAvatarUrl(u.key),
    name: u.name,
    nickname: u.nickname,
    birthYear: u.birthYear,
    gender: u.gender,
    role: u.role,
    lastLoginAt: new Date('2026-05-01T09:00:00Z'),
  }));

  // 3. Social accounts (kakao/naver/apple — V1.0)
  const socialAccounts = USER_DEFS.map((u) => ({
    id: id(`social:${u.key}`),
    userId: userIdByKey[u.key]!,
    provider: u.provider,
    providerAccountId: `${u.provider}-${u.key}-id`,
    rawProfile: { name: u.name, email: u.email } as Record<string, string>,
    appleRefreshToken: u.provider === 'apple' ? `apple-refresh-${u.key}` : (null as string | null),
    isPrivateEmail: u.provider === 'apple',
  }));

  // 4. Notification settings (1:1)
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

  // 5. Templates (previewImageKey: picsum URL)
  const templateIdByKey: Record<string, string> = {};
  for (const t of TEMPLATE_DEFS) templateIdByKey[t.key] = id(`template:${t.key}`);

  const templates = TEMPLATE_DEFS.map((t) => ({
    id: templateIdByKey[t.key]!,
    name: t.name,
    previewImageKey: templatePreviewUrl(`template-${t.key}`),
    theme: t.theme,
    font: t.font,
    effect: t.effect,
    isActive: t.isActive,
  }));

  // 5-1. Mission Templates
  const missionTemplates = MISSION_TEMPLATE_DEFS.map((mt) => ({
    id: id(`missionTemplate:${mt.key}`),
    content: mt.content,
    isActive: mt.isActive,
  }));

  // 6. Invitations (mainImageKey: picsum URL — S3Service.getPublicUrl 패스스루)
  const invIdByKey: Record<string, string> = {};
  for (const inv of INV_DEFS) invIdByKey[inv.key] = id(`invitation:${inv.key}`);

  const invitations = INV_DEFS.map((inv) => ({
    id: invIdByKey[inv.key]!,
    userId: userIdByKey[inv.hostKey]!,
    templateId: inv.templateKey ? templateIdByKey[inv.templateKey]! : (null as string | null),
    status: inv.status,
    title: inv.title,
    description: inv.description,
    mainImageKey: invitationCoverUrl(inv.key),
    eventStartAt: inv.eventStartAt,
    isMissionEnabled: inv.isMissionEnabled,
  }));

  // 7. Participants
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
        rsvpStatus: idx === 0 ? 'attending' : pick(RSVP_PATTERN, idx),
      });
    }
  }

  // 8. Event locations (75% of invitations)
  const eventLocations = INV_DEFS.filter((inv) => inv.hasLocation).map((inv, locIdx) => {
    const city = faker.location.city();
    const street = faker.location.streetAddress();
    const lat = 35 + ((locIdx * 0.03) % 4); // 35~39 (한국 위도 범위)
    const lng = 126 + ((locIdx * 0.04) % 3); // 126~129 (한국 경도 범위)
    return {
      id: id(`eventloc:${inv.key}`),
      invitationId: invIdByKey[inv.key]!,
      address: `${city} ${street}`,
      placeName: `${city} ${pick(['파티룸', '카페', '레스토랑', '루프탑', '펜션', '리조트', '바'], locIdx)}`,
      detailAddress: `${street} ${(locIdx % 9) + 1}층`,
      lat,
      lng,
      placeId: `place-${inv.key}`,
    };
  });

  // 9. Send logs
  const sendLogs = INV_PARTICIPANT_KEYS.flatMap(([invKey, userKeys], invIdx) => {
    const hostUserId = userIdByKey[userKeys[0]!]!;
    const invId = invIdByKey[invKey]!;
    const baseUrl = `https://wara.dev/invite/${invId}`;
    const base: Array<{
      id: string; invitationId: string; senderId: string;
      channel: 'link' | 'kakao' | 'sms' | 'instagram'; inviteUrl: string;
    }> = [
      { id: id(`sendlog:${invKey}:0`), invitationId: invId, senderId: hostUserId, channel: 'kakao', inviteUrl: baseUrl },
      { id: id(`sendlog:${invKey}:1`), invitationId: invId, senderId: hostUserId, channel: 'link',  inviteUrl: baseUrl },
    ];
    if (invIdx % 2 === 0 && userKeys.length >= 2) {
      base.push({
        id: id(`sendlog:${invKey}:guest`),
        invitationId: invId,
        senderId: userIdByKey[userKeys[1]!]!,
        channel: pick(SEND_CHANNELS, invIdx),
        inviteUrl: baseUrl,
      });
    }
    return base;
  });

  // 9-1. Invitation link events
  const ANALYTICS_BASE_TIME = new Date('2026-05-01T00:00:00Z').getTime();
  const invitationLinkEvents = [
    ...INV_PARTICIPANT_KEYS.flatMap(([invKey, userKeys]) => {
      const kakaoLogId = id(`sendlog:${invKey}:0`);
      const linkLogId  = id(`sendlog:${invKey}:1`);
      const secondUserKey = (userKeys[1] ?? userKeys[0])!;
      const secondUserId = userIdByKey[secondUserKey]!;
      return [
        { id: id(`linkevent:${invKey}:kakao:opened`), logId: kakaoLogId, eventType: 'opened' as const, userId: secondUserId },
        { id: id(`linkevent:${invKey}:kakao:joined`), logId: kakaoLogId, eventType: 'joined' as const, userId: secondUserId },
        { id: id(`linkevent:${invKey}:link:opened`),  logId: linkLogId,  eventType: 'opened' as const, userId: null as string | null },
      ];
    }),
    ...sendLogs.flatMap((log, logIdx) => {
      const hour = logIdx % 24;
      const day = Math.floor(logIdx / 24) % 14;
      const t = (extraMin: number) =>
        new Date(ANALYTICS_BASE_TIME + day * 86_400_000 + hour * 3_600_000 + extraMin * 60_000);
      const guestUserKey = GUEST_KEYS[logIdx % GUEST_KEYS.length]!;
      const events: Array<{
        id: string;
        logId: string;
        eventType: 'opened' | 'joined';
        userId: string | null;
        createdAt: Date;
      }> = [
        { id: id(`linkevent:${log.id}:anon`),  logId: log.id, eventType: 'opened', userId: null,                       createdAt: t(0) },
        { id: id(`linkevent:${log.id}:login`), logId: log.id, eventType: 'opened', userId: userIdByKey[guestUserKey]!, createdAt: t(15) },
      ];
      if (logIdx % 2 === 0) {
        events.push({ id: id(`linkevent:${log.id}:join`), logId: log.id, eventType: 'joined', userId: userIdByKey[guestUserKey]!, createdAt: t(60) });
      }
      return events;
    }),
  ];

  // 10. Blocklists (inv001에 active + soft-deleted 1건씩)
  const firstInvKey = INV_DEFS[0]!.key;
  const blocklists = [
    {
      id: id(`blocklist:${firstInvKey}:active`),
      invitationId: invIdByKey[firstInvKey]!,
      blockedUserId: userIdByKey['blocked']!,
      blockedByUserId: userIdByKey[INV_DEFS[0]!.hostKey]!,
      deletedAt: null as Date | null,
    },
    {
      id: id(`blocklist:${firstInvKey}:deleted`),
      invitationId: invIdByKey[firstInvKey]!,
      blockedUserId: userIdByKey[GUEST_KEYS[10]!]!,
      blockedByUserId: userIdByKey[INV_DEFS[0]!.hostKey]!,
      deletedAt: new Date('2026-03-01T12:00:00Z'),
    },
  ];

  // 11. Participant locations (event_location 있는 invitation의 attending GUEST)
  const eventLocByInvKey: Record<string, { lat: number; lng: number }> = {};
  for (const inv of INV_DEFS.filter((i) => i.hasLocation)) {
    const loc = eventLocations.find((e) => e.invitationId === invIdByKey[inv.key]);
    if (loc) eventLocByInvKey[inv.key] = { lat: loc.lat, lng: loc.lng };
  }

  const participantLocations = Object.entries(eventLocByInvKey).flatMap(([invKey, loc]) => {
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

  // 12. Missions (mission enabled invitation에 1~3건씩)
  type MissionRow = {
    id: string; invitationId: string; participantId: string; content: string;
    invKey: string; missionIdx: number;
  };
  const missionRows: MissionRow[] = [];
  for (const inv of INV_DEFS.filter((i) => i.isMissionEnabled)) {
    const userKeys = INV_PARTICIPANT_KEYS.find(([k]) => k === inv.key)![1];
    const guests = userKeys.slice(1); // exclude host
    const missionCount = Math.min(2 + (INV_DEFS.indexOf(inv) % 3), guests.length); // 2~4
    for (let mi = 0; mi < missionCount; mi++) {
      const guestKey = guests[mi % guests.length]!;
      missionRows.push({
        id: id(`mission:${inv.key}:${mi}`),
        invitationId: invIdByKey[inv.key]!,
        participantId: partIdByKey[inv.key]![guestKey]!,
        content: `${pick(MISSION_CONTENT_BASE, mi + INV_DEFS.indexOf(inv))} 미션`,
        invKey: inv.key,
        missionIdx: mi,
      });
    }
  }
  const missions = missionRows.map(({ id, invitationId, participantId, content }) => ({
    id, invitationId, participantId, content,
  }));

  // 12-1. Mission assignments
  const missionAssignments = missionRows.map((m) => {
    const isCompleted = m.missionIdx % 2 === 0;
    return {
      id: id(`missionassign:${m.invKey}:${m.missionIdx}`),
      missionId: m.id,
      participantId: m.participantId,
      assignedAt: new Date('2026-04-15T10:00:00Z'),
      completedAt: isCompleted ? new Date('2026-04-18T15:30:00Z') : (null as Date | null),
    };
  });

  // 13. Photos (PHOTOS_PER_INVITATION per invitation) + photo_likes
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

    for (let i = 0; i < PHOTOS_PER_INVITATION; i++) {
      const photoId = id(`photo:${invKey}:${i}`);
      photoIdsByInv[invKey]!.push(photoId);

      const uploaderId = pIds[i % pIds.length]!;
      const invIdx = INV_DEFS.findIndex((d) => d.key === invKey);
      const isSoftDeleted = invIdx % 25 === 0 && i === PHOTOS_PER_INVITATION - 1; // 약 4% soft-deleted
      const others = pIds.filter((p) => p !== uploaderId);
      const likerCount = isSoftDeleted ? 0 : Math.min(PHOTO_LIKE_PATTERN[i]!, others.length);
      const startIdx = others.length > 0 ? i % others.length : 0;
      const likers = [...others.slice(startIdx), ...others.slice(0, startIdx)].slice(0, likerCount);

      photos.push({
        id: photoId,
        participantId: uploaderId,
        invitationId: invIdByKey[invKey]!,
        imageKey: photoUrl(`${invKey}-${i}`),
        exifMetadata: {
          width: 1280,
          height: 853,
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

  // 14. Feedbacks (4 inv + 4 photo + 2 reply + 1 deleted + 1 extra) + feedback_likes
  const feedbacks: Array<{
    id: string; participantId: string;
    invitationId: string | null; photoId: string | null; parentId: string | null;
    content: string; likeCount: number; deletedAt: Date | null;
  }> = [];
  const feedbackLikes: Array<{ id: string; feedbackId: string; participantId: string }> = [];

  for (const [invKey, userKeys] of INV_PARTICIPANT_KEYS) {
    const pIds = userKeys.map((uk) => partIdByKey[invKey]![uk]!);
    const invId = invIdByKey[invKey]!;
    const invPhotos = photoIdsByInv[invKey]!;

    const fbInvIds: string[] = [];
    const fbPhotoIds: string[] = [];

    // 4 invitation-level
    for (let i = 0; i < 4; i++) {
      const fbId = id(`feedback:${invKey}:inv:${i}`);
      fbInvIds.push(fbId);
      const authorId = pIds[(i + 1) % pIds.length]!;
      const others = pIds.filter((p) => p !== authorId);
      const likerCount = Math.min(FEEDBACK_LIKE_PATTERN[i]!, others.length);
      const likers = others.slice(0, likerCount);

      feedbacks.push({
        id: fbId, participantId: authorId, invitationId: invId, photoId: null, parentId: null,
        content: pick(FEEDBACK_INV_TEMPLATES, i), likeCount: likers.length, deletedAt: null,
      });
      likers.forEach((lId, li) => feedbackLikes.push({ id: id(`fblike:${invKey}:inv:${i}:${li}`), feedbackId: fbId, participantId: lId }));
    }

    // 4 photo-level
    for (let i = 0; i < 4; i++) {
      const fbId = id(`feedback:${invKey}:photo:${i}`);
      fbPhotoIds.push(fbId);
      const authorId = pIds[(i + 2) % pIds.length]!;
      const others = pIds.filter((p) => p !== authorId);
      const likerCount = Math.min(FEEDBACK_LIKE_PATTERN[i + 4]!, others.length);
      const likers = others.slice(0, likerCount);

      feedbacks.push({
        id: fbId, participantId: authorId, invitationId: null, photoId: invPhotos[i]!, parentId: null,
        content: pick(FEEDBACK_PHOTO_TEMPLATES, i), likeCount: likers.length, deletedAt: null,
      });
      likers.forEach((lId, li) => feedbackLikes.push({ id: id(`fblike:${invKey}:photo:${i}:${li}`), feedbackId: fbId, participantId: lId }));
    }

    // Reply 0 → inv feedback[0]
    feedbacks.push({
      id: id(`feedback:${invKey}:reply:0`),
      participantId: pIds[3 % pIds.length]!,
      invitationId: invId, photoId: null, parentId: fbInvIds[0]!,
      content: pick(REPLY_TEMPLATES, 0), likeCount: 0, deletedAt: null,
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
      content: pick(REPLY_TEMPLATES, 1), likeCount: r1Likers.length, deletedAt: null,
    });
    r1Likers.forEach((lId, li) => feedbackLikes.push({ id: id(`fblike:${invKey}:reply:1:${li}`), feedbackId: r1Id, participantId: lId }));

    // Soft-deleted
    feedbacks.push({
      id: id(`feedback:${invKey}:deleted:0`),
      participantId: pIds[1 % pIds.length]!,
      invitationId: invId, photoId: null, parentId: null,
      content: '(삭제된 댓글입니다)', likeCount: 0, deletedAt: new Date('2026-04-10T12:00:00Z'),
    });

    // Extra photo feedback
    feedbacks.push({
      id: id(`feedback:${invKey}:photo:4`),
      participantId: pIds[0]!,
      invitationId: null, photoId: invPhotos[4]!, parentId: null,
      content: pick(FEEDBACK_PHOTO_TEMPLATES, 4), likeCount: 0, deletedAt: null,
    });
  }

  // 14-1. Inquiries
  const inquiries = INQUIRY_DEFS.map((inq) => ({
    id: id(`inquiry:${inq.key}`),
    userId: userIdByKey[inq.userKey]!,
    inquiryType: inq.inquiryType,
    status: inq.status,
    title: inq.title,
    content: inq.content,
    answer: inq.answer,
    answeredAt: inq.answeredAt,
    adminId: inq.adminAnswers ? userIdByKey['admin']! : (null as string | null),
    deletedAt: inq.deletedAt,
  }));

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
    invitationLinkEvents,
    blocklists,
    participantLocations,
    missions,
    missionAssignments,
    photos,
    photoLikes,
    feedbacks,
    feedbackLikes,
    notifications,
    inquiries,
  };
}

export const SEEDS = buildSeeds();

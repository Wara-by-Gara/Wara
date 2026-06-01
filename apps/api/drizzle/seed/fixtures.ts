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
const PHOTO_COUNT_VARIANTS = [5, 6, 8, 12, 15, 20, 25, 30] as const;
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

// ── 실재하는 한국 모임 장소 데이터셋 ──────────────────────────────────────────
// 잘 알려진 랜드마크/거리 중심으로 큐레이션. 위경도는 대표 좌표(±수십 m 오차 가능).
const REAL_EVENT_LOCATIONS = [
  { placeName: '롯데월드타워 서울스카이', address: '서울특별시 송파구 올림픽로 300', detailAddress: '117층 전망대 라운지', lat: 37.5125, lng: 127.1025 },
  { placeName: '코엑스 별마당도서관', address: '서울특별시 강남구 영동대로 513', detailAddress: 'B1 별마당도서관', lat: 37.5126, lng: 127.0589 },
  { placeName: '동대문디자인플라자(DDP)', address: '서울특별시 중구 을지로 281', detailAddress: '아트홀 2층', lat: 37.5673, lng: 127.0094 },
  { placeName: 'N서울타워', address: '서울특별시 용산구 남산공원길 105', detailAddress: '전망대 2층', lat: 37.5512, lng: 126.9882 },
  { placeName: '경복궁', address: '서울특별시 종로구 사직로 161', detailAddress: '광화문 앞 광장', lat: 37.5796, lng: 126.9770 },
  { placeName: '북촌 한옥마을', address: '서울특별시 종로구 계동길 37', detailAddress: '북촌로11길 일대', lat: 37.5826, lng: 126.9831 },
  { placeName: '익선동 한옥거리', address: '서울특별시 종로구 익선동', detailAddress: '익선동 166-39', lat: 37.5736, lng: 126.9899 },
  { placeName: '성수동 카페거리', address: '서울특별시 성동구 연무장길 53', detailAddress: '성수동2가 일대', lat: 37.5444, lng: 127.0557 },
  { placeName: '연남동 경의선숲길', address: '서울특별시 마포구 연남동 동진시장', detailAddress: '연남동 일대', lat: 37.5612, lng: 126.9244 },
  { placeName: '홍대 걷고싶은거리', address: '서울특별시 마포구 어울마당로 35', detailAddress: '홍익광장 인근', lat: 37.5510, lng: 126.9220 },
  { placeName: '이태원 해방촌', address: '서울특별시 용산구 신흥로 99', detailAddress: '신흥로 99', lat: 37.5453, lng: 126.9893 },
  { placeName: '한강공원 반포지구', address: '서울특별시 서초구 신반포로11길 40', detailAddress: '달빛광장', lat: 37.5108, lng: 126.9956 },
  { placeName: '여의도 한강공원', address: '서울특별시 영등포구 여의동로 330', detailAddress: '물빛광장', lat: 37.5285, lng: 126.9326 },
  { placeName: '잠실 롯데월드몰', address: '서울특별시 송파구 올림픽로 240', detailAddress: '6층 푸드코트', lat: 37.5135, lng: 127.1028 },
  { placeName: '가로수길', address: '서울특별시 강남구 신사동 가로수길', detailAddress: '강남구 도산대로13길', lat: 37.5203, lng: 127.0231 },
  { placeName: '수원 화성행궁', address: '경기도 수원시 팔달구 정조로 825', detailAddress: '신풍루 앞 광장', lat: 37.2877, lng: 127.0125 },
  { placeName: '가평 남이섬', address: '강원특별자치도 춘천시 남산면 남이섬길 1', detailAddress: '메타세쿼이아길', lat: 37.7905, lng: 127.5258 },
  { placeName: '인천 송도 센트럴파크', address: '인천광역시 연수구 컨벤시아대로 160', detailAddress: '동측 야외광장', lat: 37.3922, lng: 126.6406 },
  { placeName: '강릉 안목해변 커피거리', address: '강원특별자치도 강릉시 창해로14번길', detailAddress: '안목해변 카페거리', lat: 37.7758, lng: 128.9479 },
  { placeName: '춘천 명동 닭갈비골목', address: '강원특별자치도 춘천시 금강로62번길', detailAddress: '명동 닭갈비골목', lat: 37.8813, lng: 127.7298 },
  { placeName: '부산 해운대해수욕장', address: '부산광역시 해운대구 해운대해변로 264', detailAddress: '구남로 일대', lat: 35.1587, lng: 129.1604 },
  { placeName: '부산 광안리해수욕장', address: '부산광역시 수영구 광안해변로 219', detailAddress: '광안해변 무대', lat: 35.1531, lng: 129.1187 },
  { placeName: '대구 김광석 다시그리기길', address: '대구광역시 중구 달구벌대로 2238', detailAddress: '벽화골목 입구', lat: 35.8627, lng: 128.6005 },
  { placeName: '전주 한옥마을', address: '전북특별자치도 전주시 완산구 기린대로 99', detailAddress: '경기전 앞 마당', lat: 35.8142, lng: 127.1535 },
  { placeName: '광주 양림동 카페거리', address: '광주광역시 남구 서서평길', detailAddress: '펭귄마을 인근', lat: 35.1411, lng: 126.9152 },
  { placeName: '여수 낭만포차거리', address: '전라남도 여수시 종화동', detailAddress: '낭만포차거리 11번', lat: 34.7457, lng: 127.7440 },
  { placeName: '제주 성산일출봉', address: '제주특별자치도 서귀포시 성산읍 일출로 284-12', detailAddress: '주차장 앞 광장', lat: 33.4583, lng: 126.9425 },
  { placeName: '제주 협재해수욕장', address: '제주특별자치도 제주시 한림읍 협재리', detailAddress: '협재해변 입구', lat: 33.3946, lng: 126.2398 },
  { placeName: '경주 황리단길', address: '경상북도 경주시 포석로', detailAddress: '황리단길 중앙', lat: 35.8347, lng: 129.2104 },
  { placeName: '안동 하회마을', address: '경상북도 안동시 풍천면 하회종가길 40', detailAddress: '충효당 앞', lat: 36.5391, lng: 128.5180 },
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
  // 실재하는 한국 장소를 invitation별로 순환 배정 (REAL_EVENT_LOCATIONS 풀 사용)
  const eventLocations = INV_DEFS.filter((inv) => inv.hasLocation).map((inv, locIdx) => {
    const place = REAL_EVENT_LOCATIONS[locIdx % REAL_EVENT_LOCATIONS.length]!;
    return {
      id: id(`eventloc:${inv.key}`),
      invitationId: invIdByKey[inv.key]!,
      address: place.address,
      placeName: place.placeName,
      detailAddress: place.detailAddress,
      lat: place.lat,
      lng: place.lng,
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

  // 13. Photos (count cycles through PHOTO_COUNT_VARIANTS per invitation) + photo_likes
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

    const invIdx = INV_DEFS.findIndex((d) => d.key === invKey);
    const photoCount = PHOTO_COUNT_VARIANTS[invIdx % PHOTO_COUNT_VARIANTS.length]!;

    for (let i = 0; i < photoCount; i++) {
      const photoId = id(`photo:${invKey}:${i}`);
      photoIdsByInv[invKey]!.push(photoId);

      const uploaderId = pIds[i % pIds.length]!;
      const isSoftDeleted = invIdx % 25 === 0 && i === photoCount - 1; // 약 4% soft-deleted
      const others = pIds.filter((p) => p !== uploaderId);
      const likerCount = isSoftDeleted ? 0 : Math.min(PHOTO_LIKE_PATTERN[i % PHOTO_LIKE_PATTERN.length]!, others.length);
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

// ── 약관 시드 (정적 데이터) ─────────────────────────────────────────────────────
const PUBLISHED_AT = new Date('2026-06-01T00:00:00Z');

export const TERMS_SEEDS = [
  {
    id: id('term:service:v1.0'),
    termType: 'service' as const,
    version: 'v1.0',
    title: 'WARA 서비스 이용약관',
    isActive: true,
    isRequired: true,
    publishedAt: PUBLISHED_AT,
    createdBy: null as string | null,
    content: `WARA 서비스 이용약관
시행일자: 2026년 6월 1일

본 약관은 WARA 운영팀(이하 "운영진")이 제공하는 맞춤형 모임 초대 및 추억 공유 플랫폼 WARA 웹·모바일 서비스(이하 "서비스")의 이용과 관련하여 운영진과 이용자 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.

제1조 (목적)
본 약관은 이용자가 WARA 서비스를 이용함에 있어 운영진과 회원 간의 권리·의무 및 책임사항, 서비스 이용조건 및 절차 등 기본적인 사항을 규정함을 목적으로 합니다.

제2조 (정의)
본 약관에서 사용하는 용어의 정의는 다음과 같습니다.
1. "서비스"란 구현되는 단말기(PC, 모바일, 태블릿 등 각종 유무선 장치를 포함)와 관계없이 이용자가 사용할 수 있는 WARA 브랜드 기반의 모임 초대, 참여 관리, 커뮤니티 및 추억 공유 서비스를 의미합니다.
2. "회원"이란 본 약관 및 개인정보 수집·이용 동의 및 개인정보처리방침 확인하고 소셜 로그인 등을 통해 운영진과 이용계약을 체결한 자를 의미합니다.
3. "호스트"란 서비스를 이용하여 모임을 생성하고 참여자를 초대하는 회원을 의미합니다.
4. "게스트"란 호스트가 생성한 초대장 링크를 통하여 모임에 참여하거나 참석 여부를 제출하는 이용자를 의미합니다.
5. "콘텐츠"란 회원이 서비스에 업로드하거나 공유하는 사진, 이미지, 영상, 텍스트, 댓글, 메시지 및 기타 정보 일체를 의미합니다.
6. "위치기반서비스"란 이용자의 실시간 위치정보를 활용하여 제공되는 참여자 위치 확인, 도착 감지, 지연 알림 등의 기능을 의미합니다.

제3조 (약관의 게시, 명시·설명 및 개정)
1. 운영진은 본 약관의 내용을 이용자가 쉽게 확인할 수 있도록 회원가입 화면 및 서비스 내 설정 메뉴 등에 게시합니다.
2. 운영진은 이용자가 약관 내용을 이해할 수 있도록 중요한 내용(면책조항, 탈퇴 절차, 게시물 이용 범위 등)을 회원가입 시 별도로 명시하거나 설명합니다.
3. 운영진은 「약관의 규제에 관한 법률」, 「전자상거래 등에서의 소비자보호에 관한 법률」, 「정보통신망 이용촉진 및 정보보호 등에 관한 법률」 등 관련 법령을 위반하지 않는 범위에서 본 약관을 개정할 수 있습니다.
4. 운영진이 약관을 개정할 경우에는 적용일자 및 개정사유를 명시하여 적용일 7일 전부터 공지합니다. 다만 이용자에게 불리한 변경의 경우 최소 30일 전에 서비스 화면 공지 및 이메일(또는 앱 푸시 알림)을 통하여 개별 통지합니다.
5. 회원이 개정약관 시행일까지 명시적으로 거부 의사를 표시하지 않고 서비스를 계속 이용하는 경우 개정약관에 동의한 것으로 봅니다.

제4조 (이용계약의 체결)
1. 이용계약은 이용자가 본 약관 및 개인정보 수집·이용 동의 및 개인정보처리방침 확인하고 운영진이 제공하는 로그인 절차를 완료함으로써 성립합니다.
2. 운영진은 다음 각 호의 경우 이용계약 체결을 거절하거나 사후 이용을 제한할 수 있습니다.
   가. 타인의 정보를 도용한 경우
   나. 허위 정보를 기재한 경우
   다. 관련 법령 또는 공공질서·미풍양속에 위반되는 목적으로 서비스를 이용하려는 경우
   라. 서비스 운영을 고의로 방해할 우려가 있는 경우
3. 운영진은 서비스 품질 향상 및 안전한 운영을 위하여 본인확인 또는 추가 인증 절차를 요구할 수 있습니다.

제5조 (서비스의 제공)
1. 운영진은 다음 각 호의 서비스를 제공합니다.
   가. 맞춤형 모임 초대장 생성 및 공유
   나. 모임 일정 및 참석 여부 관리
   다. 참여자 간 커뮤니티 및 갤러리 기능
   라. 다이렉트 메시지(DM) 기능
   마. 위치기반 참여 관리 기능
   바. 기타 운영진이 추가 개발하거나 제휴를 통하여 제공하는 서비스
2. DM 및 커뮤니티 기능 이용 시 추가적인 개인정보 수집이 발생할 수 있으며, 운영진은 해당 기능 최초 이용 시 별도의 동의를 받습니다.
3. 운영진은 서비스 운영상·기술상 필요에 따라 서비스의 전부 또는 일부를 변경할 수 있습니다.
4. 운영진은 정기점검, 서버 증설, 시스템 교체, 장애 발생 또는 기타 상당한 이유가 있는 경우 서비스 제공을 일시적으로 중단할 수 있습니다.
5. 운영진은 무료 서비스 특성상 데이터의 영구 보관을 보장하지 않으며, 회원은 필요한 경우 콘텐츠를 별도로 저장·백업하여야 합니다.

제6조 (회원의 의무)
1. 회원은 관련 법령, 본 약관 및 운영정책을 준수하여야 합니다.
2. 회원은 다음 각 호의 행위를 하여서는 안 됩니다.
   가. 타인의 개인정보 또는 계정정보 도용
   나. 허위 모임 생성 또는 사기 목적 이용
   다. 스팸성 초대장 발송
   라. 음란물, 불법촬영물, 혐오표현, 명예훼손 게시물 등록
   마. 타인의 저작권·초상권 등 권리 침해
   바. 서비스 시스템에 대한 비정상적 접근 또는 공격 행위
   사. 기타 관련 법령에 위반되는 행위
3. 회원은 서비스 이용 과정에서 타인의 권리를 침해하지 않도록 주의하여야 하며, 회원이 등록한 콘텐츠로 인해 발생한 분쟁에 대한 책임은 해당 회원에게 있습니다.

제7조 (게시물의 권리 및 이용)
1. 회원이 서비스에 업로드한 콘텐츠의 저작권은 해당 회원에게 귀속됩니다.
2. 회원은 서비스 운영 및 기능 제공을 위하여 운영진에게 다음 범위 내에서 콘텐츠를 사용할 수 있는 비독점적 이용권을 부여합니다.
   가. 서비스 내 게시·복제·전송·전시
   나. 모임 리마인드 앨범 생성
   다. 서비스 기능 개선 및 UI 구성
   라. 통계 및 분석 목적의 비식별화 처리
3. 운영진은 회원의 사전 동의 없이 회원 콘텐츠를 서비스 외부 광고·홍보 목적으로 사용하지 않습니다.
4. 회원은 자신이 게시한 콘텐츠를 언제든지 삭제할 수 있으며, 운영진은 관련 법령에 특별한 규정이 없는 한 삭제 요청을 지체 없이 처리합니다.

제8조 (권리침해 신고 및 게시물 조치)
1. 회원 또는 권리자는 서비스 내 게시물이 저작권, 초상권, 개인정보 또는 기타 권리를 침해한다고 판단하는 경우 운영진에게 신고할 수 있습니다.
2. 운영진은 신고 접수 시 관련 법령에 따라 해당 게시물에 대한 임시조치(30일 이내), 삭제 또는 접근 제한 등의 조치를 취할 수 있습니다.
3. 운영진이 임시조치를 취한 경우 게시물 작성자에게 그 사실을 즉시 통지하며, 게시물 작성자는 임시조치에 이의가 있는 경우 운영진에게 재게시를 요청할 수 있습니다.
4. 운영진은 불법촬영물 등 관련 법령상 즉시 조치가 필요한 게시물에 대하여 사전 통지 없이 삭제 또는 차단 조치를 할 수 있습니다.

제9조 (서비스 이용 제한)
1. 운영진은 회원이 본 약관을 위반하거나 서비스 운영을 방해하는 경우 경고, 일부 기능 제한, 이용정지 또는 영구 이용제한 조치를 취할 수 있습니다.
2. 운영진은 긴급한 보안상 필요, 법령 위반, 타인의 권리 침해 또는 서비스 보호 필요성이 인정되는 경우 사전 통지 없이 이용을 제한할 수 있으며, 가능한 경우 사후 통지합니다.

제10조 (회원 탈퇴 및 계약 해지)
1. 회원은 언제든지 서비스 내 설정 메뉴를 통하여 회원 탈퇴를 신청할 수 있습니다.
2. 운영진은 관련 법령에서 정한 보관의무가 있는 경우를 제외하고 회원 탈퇴 후 지체 없이 회원의 개인정보를 파기합니다.
3. 회원 탈퇴 시 다른 참여자와 공동으로 생성한 모임 콘텐츠는 회원 식별정보를 삭제하거나 비식별 처리한 후 서비스 내에 유지될 수 있습니다.
4. 운영진은 회원 탈퇴 시 공동 생성 콘텐츠에 포함된 닉네임·프로필 정보 등을 비식별 처리할 수 있습니다.

제11조 (면책조항)
1. 운영진은 천재지변, 전쟁, 기간통신사업자의 서비스 중단, DDoS 공격, 서버 장애 또는 이에 준하는 불가항력으로 인하여 서비스를 제공할 수 없는 경우 책임을 부담하지 않습니다.
2. 운영진은 회원 상호 간 또는 회원과 제3자 간에 서비스를 매개로 발생한 분쟁에 개입하지 않으며, 이에 대한 책임을 부담하지 않습니다.
3. 운영진은 현재 무료로 제공되는 서비스에 대하여 운영진의 고의 또는 중대한 과실이 없는 한 책임을 부담하지 않습니다.
4. 운영진은 회원이 서비스에 게시·전송한 정보의 정확성·신뢰성에 대하여 보증하지 않습니다.
5. 운영진은 운영진의 고의 또는 중대한 과실이 없는 한 위치정보 오차, 통신 장애, GPS 수신 오류 등으로 인한 손해에 대하여 책임을 부담하지 않습니다.

제12조 (손해배상)
회원이 본 약관 또는 관련 법령을 위반하여 운영진 또는 제3자에게 손해를 발생시킨 경우 해당 회원은 그 손해를 배상하여야 합니다.

제13조 (준거법 및 관할)
1. 본 약관은 대한민국 법령에 따라 해석되고 적용됩니다.
2. 서비스 이용과 관련하여 운영진과 회원 간 발생한 분쟁에 관한 소송의 관할은 대한민국 민사소송법에 따릅니다.`,
  },
  {
    id: id('term:privacy:v1.0'),
    termType: 'privacy' as const,
    version: 'v1.0',
    title: 'WARA 개인정보처리방침',
    isActive: true,
    isRequired: true,
    publishedAt: PUBLISHED_AT,
    createdBy: null as string | null,
    content: `WARA 개인정보처리방침
시행일자: 2026년 6월 1일

WARA 운영팀(이하 "운영진")은 「개인정보 보호법」 제30조에 따라 정보주체의 개인정보를 보호하고 관련 고충을 신속하고 원활하게 처리하기 위하여 다음과 같이 개인정보처리방침을 수립·공개합니다.

제1조 (개인정보의 처리 목적)
운영진은 다음 목적을 위하여 최소한의 개인정보를 처리합니다.
1. 회원가입 및 본인 식별
2. 소셜 로그인 인증 및 계정 관리
3. 모임 생성·운영 및 참석 관리
4. 참여자 간 커뮤니케이션 기능 제공
5. 사진·게시물 기반 추억 공유 기능 제공
6. 위치기반 서비스 제공
7. 고객 문의 응대 및 민원 처리
8. 서비스 품질 개선 및 통계 분석
9. 부정 이용 방지 및 보안 관리

제2조 (처리하는 개인정보 항목)
- 회원가입: 소셜 플랫폼 고유 ID, 닉네임, 이메일, 프로필 이미지 (이용계약 이행)
- 모임 서비스: 모임명, 일정, 장소, 참석 여부 (이용계약 이행)
- 위치기반서비스: GPS 위치정보, 기기 위치 권한 정보 (별도 동의)
- 커뮤니티 기능: 사진, 게시글, 댓글, 메시지 (이용계약 이행)
- 자동수집(필수): 접속 로그, IP 주소, 기기 정보 (법령 의무)
- 자동수집(선택·쿠키): 쿠키, 앱 이용 기록, 서비스 분석 (별도 동의)
운영진은 원칙적으로 주민등록번호 등 고유식별정보를 수집하지 않습니다.

제3조 (개인정보의 처리 및 보유기간)
1. 운영진은 개인정보 수집·이용 목적이 달성된 후 지체 없이 개인정보를 파기합니다.
2. 관계 법령에 따라 일정 기간 보관이 필요한 경우:
   - 서비스 이용 기록: 최대 3개월 (통신비밀보호법)
   - 소비자 불만 및 분쟁 기록: 3년 (전자상거래법)
   - 계약 및 철회 기록: 5년 (전자상거래법)
   - 위치정보 이용·제공사실 확인자료: 6개월 (위치정보법)

제4조 (개인정보의 제3자 제공)
1. 운영진은 정보주체의 동의 없이 개인정보를 외부에 제공하지 않습니다.
2. 다만 정보주체의 사전 동의, 법령의 특별한 규정, 수사기관의 적법한 요청이 있는 경우에는 예외로 합니다.

제5조 (개인정보 처리위탁)
- Amazon Web Services (AWS): 클라우드 서버 및 데이터 저장
운영진은 위탁계약 체결 시 관련 법령에 따라 개인정보 보호가 안전하게 이루어지도록 관리·감독합니다.

제6조 (개인정보의 국외 이전)
- Amazon Web Services (미국 등): 서비스 이용 데이터 — 표준계약 체결
- Google (미국): 앱 분석 및 인증 데이터 — 표준계약 체결
- Apple (미국): 로그인 인증 정보 — 표준계약 체결
정보주체는 개인정보 국외 이전을 거부할 권리가 있으나, 이 경우 일부 서비스 이용이 제한될 수 있습니다.

제7조 (정보주체의 권리)
1. 정보주체는 언제든지 개인정보 열람, 정정, 삭제, 처리정지 및 동의 철회를 요청할 수 있습니다.
2. 권리 행사는 이메일(wara.invite@gmail.com) 또는 서비스 내 기능을 통하여 할 수 있으며, 운영진은 요청을 받은 날로부터 10일 이내에 조치 결과를 통지합니다.
3. 정보주체는 위치정보 이용 동의를 언제든지 철회할 수 있습니다.

제8조 (개인정보의 파기)
1. 운영진은 개인정보 보유기간 경과 또는 처리목적 달성 시 지체 없이 개인정보를 파기합니다.
2. 전자적 파일 형태의 정보는 복구 및 재생이 불가능한 방법으로 삭제합니다.

제9조 (개인정보의 안전성 확보조치)
1. HTTPS 기반 암호화 통신
2. 접근권한 최소화 및 관리자 권한 통제
3. 인증 토큰 암호화 저장
4. 비정상 접근 탐지 및 로그 관리
5. 개인정보 마스킹 및 비식별화 처리
6. 정기적 보안 점검

제10조 (EXIF 및 위치정보 처리)
1. 이용자가 업로드한 사진에 EXIF 메타데이터(촬영 시각, GPS 위치정보 등)가 포함된 경우 서비스는 모임 기록 생성 및 통계 기능 제공을 위하여 이를 분석할 수 있습니다.
2. 이용자는 사진 업로드 전 EXIF 위치정보 제거 여부를 직접 선택할 수 있습니다.
3. 운영진은 EXIF 데이터를 서비스 목적 범위를 초과하여 이용하지 않습니다.

제11조 (아동의 개인정보 보호)
1. 운영진은 만 14세 미만 아동의 개인정보를 법정대리인의 동의 없이 수집하지 않습니다.
2. 운영진이 만 14세 미만 아동의 개인정보를 수집한 사실을 인지한 경우 해당 정보를 지체 없이 삭제합니다.

제12조 (개인정보 보호책임자 및 권리구제)
개인정보 보호책임자: 김현제
담당 부서: WARA 운영팀
이메일: wara.invite@gmail.com
응답 가능 시간: 평일 10:00~18:00

권리구제 기관:
- 개인정보 침해신고센터(한국인터넷진흥원): 118 / www.privacy.kisa.or.kr
- 개인정보분쟁조정위원회: 1833-6972 / www.kopico.go.kr
- 대검찰청 사이버범죄수사단: 02-3480-3573 / www.spo.go.kr
- 경찰청 사이버안전국: 182 / cyberbureau.police.go.kr

제13조 (개인정보 유출 통지)
1. 운영진은 개인정보 유출 등 보안사고 발생 시 관련 법령에 따라 지체 없이 이용자에게 통지하고 필요한 대응 조치를 시행합니다.
2. 1천명 이상의 개인정보가 유출된 경우, 운영진은 사실을 인지한 때로부터 72시간 이내에 개인정보보호위원회에 신고합니다.

제14조 (개인정보처리방침의 변경)
본 개인정보처리방침은 법령, 정책 또는 서비스 변경에 따라 수정될 수 있으며, 변경 시 서비스 내 공지를 통하여 사전에 안내합니다.`,
  },
  {
    id: id('term:location:v1.0'),
    termType: 'location' as const,
    version: 'v1.0',
    title: 'WARA 위치기반서비스 이용약관',
    isActive: true,
    isRequired: false,
    publishedAt: PUBLISHED_AT,
    createdBy: null as string | null,
    content: `WARA 위치기반서비스 이용약관
시행일자: 2026년 6월 1일

본 약관은 WARA 운영팀(이하 "운영진")이 제공하는 위치기반서비스의 이용과 관련하여 운영진과 이용자 간의 권리·의무 및 책임사항을 규정함을 목적으로 합니다.

제1조 (목적)
본 약관은 이용자가 WARA의 위치기반서비스를 이용함에 있어 운영진과 이용자 간의 권리·의무 및 책임사항을 규정함을 목적으로 합니다.

제2조 (사업자 정보)
상호: WARA 운영팀
이메일: wara.invite@gmail.com
위치기반서비스 관련 문의: wara.invite@gmail.com

제3조 (위치기반서비스 내용)
운영진은 이용자의 동의를 받아 다음과 같은 위치기반서비스를 제공합니다.
1. 참여자의 실시간 위치 확인
2. 약속 장소 도착 감지
3. 지연 참여자 알림 제공
4. 지도 기반 참여 현황 표시
5. 위치 기반 모임 관리 기능

제4조 (위치정보 수집 및 동의·철회 절차)
1. 운영진은 모바일 기기의 GPS, Wi-Fi, 기지국 정보 등을 활용하여 위치정보를 수집할 수 있습니다.
2. 위치정보는 이용자가 위치기반 기능에 최초 진입하거나 해당 기능을 활성화하면서 별도로 동의한 경우에만 수집됩니다. 위치기반서비스 동의는 회원가입 또는 로그인 필수 조건이 아닙니다.
3. 이용자는 기기 설정 또는 서비스 내 설정 메뉴를 통하여 언제든지 위치정보 제공 동의를 철회할 수 있습니다.
4. 동의를 철회하는 경우 위치기반서비스 이용이 제한될 수 있으나, 기타 서비스 이용은 가능합니다.

제5조 (위치정보 이용 목적)
운영진은 수집한 위치정보를 다음 목적 범위 내에서만 이용합니다.
1. 모임 참여자 위치 표시
2. 목적지 도착 여부 확인
3. 참여자 간 위치 공유
4. 지연 알림 제공
5. 서비스 운영 및 품질 개선

제6조 (개인위치정보의 보유 및 이용기간)
1. 운영진은 위치기반서비스 제공 목적이 달성된 후 개인위치정보를 지체 없이 파기합니다.
2. 「위치정보의 보호 및 이용 등에 관한 법률」에 따라 개인위치정보 이용·제공사실 확인자료는 6개월간 보관합니다.
3. 운영진은 이용자의 일상적인 이동 동선을 장기 저장하거나 상업적 목적으로 활용하지 않습니다.

제7조 (개인위치정보의 제3자 제공)
1. 운영진은 이용자의 동의 없이 개인위치정보를 제3자에게 제공하지 않습니다.
2. 서비스 핵심 기능 수행을 위하여 참여자 간 위치 공유가 필요한 경우에는 이용자의 동의를 받은 범위 내에서 위치정보가 제공될 수 있습니다.
3. 운영진은 개인위치정보를 이용자가 지정하는 제3자에게 제공하는 경우, 개인위치정보를 수집한 당해 송신단말기로 매회 이용자에게 제공받는 자, 제공일시 및 제공목적을 즉시 통지합니다.

제8조 (법정대리인의 권리)
1. 운영진은 만 14세 미만 아동의 개인위치정보를 법정대리인의 동의 없이 수집하지 않습니다.
2. 법정대리인은 아동의 개인위치정보 이용에 대한 동의를 철회할 수 있습니다.

제9조 (위치정보관리책임자)
위치정보관리책임자: 김현제
소속: WARA 운영팀
이메일: wara.invite@gmail.com

제10조 (위치정보사업 관련 준수사항)
운영진은 개인위치정보를 수집·이용하는 경우 「위치정보의 보호 및 이용 등에 관한 법률」 제5조에 따라 관련 법령에 따른 적법한 방식으로 위치기반서비스를 제공합니다.

제11조 (면책)
1. 운영진은 GPS 수신 불량, 통신 장애, 기기 오류 또는 음영지역 진입 등으로 발생한 위치정보 오차에 대하여 운영진의 고의 또는 중대한 과실이 없는 한 책임을 제한할 수 있습니다.
2. 운영진은 위치정보의 기술적 특성에 따른 오차 발생 가능성을 이용자에게 고지하며, 중요한 의사결정에 위치정보를 단독 근거로 활용하지 않도록 권고합니다.

제12조 (준거법 및 관할)
1. 본 약관은 대한민국 법령에 따라 해석되고 적용됩니다.
2. 위치기반서비스 이용과 관련하여 발생한 분쟁은 대한민국 민사소송법상 관할법원을 관할법원으로 합니다.

부칙
본 약관은 2026년 6월 1일부터 시행합니다.`,
  },
];

export const SEEDS = { ...buildSeeds(), terms: TERMS_SEEDS };

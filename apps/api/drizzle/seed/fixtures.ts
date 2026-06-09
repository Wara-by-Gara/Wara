import { createHash } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { fakerKO as faker } from '@faker-js/faker';
import { INV_PRIVATE_INVITATIONS } from './private-invitation-fixtures';
import { buildPublicInvitationSeeds } from './public-invitation-fixtures';

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
const DICEBEAR_PROFILE_PREFIX = 'dicebear:';

/** 유저별 결정적 랜덤 DiceBear 시드 (재시드 시 동일 아바타) */
const profileDicebearSeed = (userKey: string) =>
  `${DICEBEAR_PROFILE_PREFIX}${id(`avatar:${userKey}`).slice(0, 12).toLowerCase()}`;
const { all: TEMPLATE_IMAGE_PATHS, byFolder: TEMPLATE_IMAGE_PATHS_BY_FOLDER } = collectTemplateImagePaths();

function collectTemplateImagePaths(): { all: string[]; byFolder: Record<string, string[]> } {
  const root = path.resolve(__dirname, '../../../web/public/template_images');
  if (!fs.existsSync(root)) return { all: [], byFolder: {} };

  const all: string[] = [];
  const byFolder: Record<string, string[]> = {};
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const categoryDir = path.join(root, entry.name);
    const folderPaths: string[] = [];
    for (const file of fs.readdirSync(categoryDir)) {
      if (!/\.(png|jpe?g|webp)$/i.test(file)) continue;
      const rel = `/template_images/${entry.name}/${file}`;
      folderPaths.push(rel);
      all.push(rel);
    }
    if (folderPaths.length > 0) {
      byFolder[entry.name] = folderPaths.sort();
    }
  }
  return { all: all.sort(), byFolder };
}

const templateImageUrlFromPool = (pool: string[], namespace: string, seedKey: string) => {
  if (pool.length === 0) {
    return `https://picsum.photos/seed/${encodeURIComponent(`${namespace}:${seedKey}`)}/1024/576`;
  }
  const hash = createHash('sha256').update(`${namespace}:${seedKey}`).digest();
  const idx = hash.readUInt32BE(0) % pool.length;
  const rel = pool[idx]!;
  const base = (process.env.FRONTEND_URL ?? 'http://localhost:3000').replace(/\/$/, '');
  const urlPath = rel.split('/').filter(Boolean).map(encodeURIComponent).join('/');
  return `${base}/${urlPath}`;
};

const templateCoverUrl = (folder: string, seedKey: string) =>
  templateImageUrlFromPool(TEMPLATE_IMAGE_PATHS_BY_FOLDER[folder] ?? TEMPLATE_IMAGE_PATHS, `template-cover:${folder}`, seedKey);

const templatePhotoUrl = (folder: string, seedKey: string) =>
  templateImageUrlFromPool(TEMPLATE_IMAGE_PATHS_BY_FOLDER[folder] ?? TEMPLATE_IMAGE_PATHS, `template-photo:${folder}`, seedKey);

/** template_images 풀에서 namespace+seedKey 기반 결정적 선택 (재시드 시 동일 URL) */
const templateImageUrl = (namespace: string, seedKey: string) => {
  if (TEMPLATE_IMAGE_PATHS.length === 0) {
    return `https://picsum.photos/seed/${encodeURIComponent(`${namespace}:${seedKey}`)}/1024/576`;
  }
  const hash = createHash('sha256').update(`${namespace}:${seedKey}`).digest();
  const idx = hash.readUInt32BE(0) % TEMPLATE_IMAGE_PATHS.length;
  const rel = TEMPLATE_IMAGE_PATHS[idx]!;
  const base = (process.env.FRONTEND_URL ?? 'http://localhost:3000').replace(/\/$/, '');
  const urlPath = rel.split('/').filter(Boolean).map(encodeURIComponent).join('/');
  return `${base}/${urlPath}`;
};
const invitationCoverUrl = (seedKey: string) => templateImageUrl('template-cover', seedKey);
const photoUrl = (seedKey: string) => templateImageUrl('template-photo', seedKey);
const templatePreviewUrl = (seedKey: string) => templateImageUrl('template-preview', seedKey);

const templateImageUrlFromRel = (rel: string) => {
  const base = (process.env.FRONTEND_URL ?? 'http://localhost:3000').replace(/\/$/, '');
  const urlPath = rel.split('/').filter(Boolean).map(encodeURIComponent).join('/');
  return `${base}/${urlPath}`;
};

/** template_images 폴더에서 대표 미리보기 1장 선택 */
const templatePreviewFromFolder = (
  folder: string,
  imageIndex: number,
  previewFile?: string,
) => {
  if (previewFile) {
    return templateImageUrlFromRel(`/template_images/${folder}/${previewFile}`);
  }
  const pool = TEMPLATE_IMAGE_PATHS_BY_FOLDER[folder];
  if (!pool?.length) return templatePreviewUrl(`template-${folder}`);
  return templateImageUrlFromRel(pool[imageIndex % pool.length]!);
};

// ── 규모 ─────────────────────────────────────────────────────────────────────
// 기본은 dev 작업용 작은 규모. 부하 테스트 시 일시적으로 늘려 사용.
// (참고: loadtest/REPORT.md — 중규모/대규모 측정 결과)
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
  { key: 'tmpl1',  name: '파티 나이트',   theme: 'party',    font: 'display', effect: 'confetti', isActive: true, previewFolder: '파티',   previewFile: 'imgi_10_1f5b32e2-8467-4bfd-9048-8dfd0231b7c1.png' },
  { key: 'tmpl2',  name: '생일 축하',     theme: 'birthday', font: 'serif',   effect: 'sparkle',  isActive: true, previewFolder: '생일',   previewFile: 'imgi_10_8e9ed34a-cc86-4632-83ec-cb4097a80961.png' },
  { key: 'tmpl3',  name: '플라워 가든',   theme: 'floral',   font: 'serif',   effect: null,       isActive: true, previewFolder: '꽃',     previewFile: 'imgi_10_1074f31e-22b4-471b-b857-8afcb2698179.png' },
  { key: 'tmpl4',  name: '여름 바캉스',   theme: 'summer',   font: 'sans',    effect: null,       isActive: true, previewFolder: '여름',   previewFile: 'imgi_10_806d0940-d8e2-46e9-9704-f25ae0e49375.png' },
  { key: 'tmpl5',  name: '클래식 초대',   theme: 'classic',  font: 'serif',   effect: null,       isActive: true, previewFolder: '초대',   previewFile: 'imgi_10_468d0b37-6b49-491d-a0f5-bb2af2ef9719.png' },
  { key: 'tmpl6',  name: '학교 축제',     theme: 'school',   font: 'sans',    effect: 'confetti', isActive: true, previewFolder: '학교',   previewFile: 'imgi_10_51ffeb4e-b392-4fc4-b105-a408c1f96987.png' },
  { key: 'tmpl7',  name: '디너 파티',     theme: 'food',     font: 'sans',    effect: null,       isActive: true, previewFolder: '음식',   previewFile: 'imgi_10_46a752da-c51b-4e24-b8d7-e3844aa37023.png' },
  { key: 'tmpl8',  name: '스포츠 데이',   theme: 'sports',   font: 'display', effect: null,       isActive: true, previewFolder: '스포츠', previewFile: 'imgi_12_7b6b9201-46c4-43e1-b394-a401b7db95d3.png' },
  { key: 'tmpl9',  name: '브런치 타임',   theme: 'brunch',   font: 'sans',    effect: null,       isActive: true, previewFolder: '음료',   previewFile: 'imgi_10_5d8e6e58-f50d-40d4-9ba8-feb9b5a1ef72.png' },
  { key: 'tmpl10', name: '테크 밋업',     theme: 'tech',     font: 'mono',    effect: 'sparkle',  isActive: true, previewFolder: 'AI',     previewFile: 'imgi_100_3c3db379-bc3e-493e-8677-d2fb311882f8.png' },
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

/** 초대장 테마 배경 (web DESIGN_BG_THEMES.cls 와 동일) */
const INVITE_BG_THEMES = [
  'bg-invite-minimal',
  'bg-invite-pastel',
  'bg-invite-sky',
  'bg-invite-glass',
  'bg-invite-y2k',
  'bg-invite-flower',
  'bg-invite-film',
  'bg-invite-aurora',
  'bg-invite-checkdot',
  'bg-invite-starry',
] as const;
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
  const privateInv = INV_PRIVATE_INVITATIONS[i]!;
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
    title: privateInv.title,
    description: privateInv.description,
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

// GIF 풀 (Klipy CDN — next.config remotePatterns에 static.klipy.com 허용됨)
// 초대장 메인 커버(gif) / gif 댓글 시드에 사용
const GIF_POOL = [
  'https://static.klipy.com/ii/c3a19a0b747a76e98651f2b9a3cca5ff/14/f5/Bo47kJNK.gif',
  'https://static.klipy.com/ii/e293a233a303a98e471f78d04e13a1b0/7b/a1/pMWZBXHj.gif',
  'https://static.klipy.com/ii/e293a233a303a98e471f78d04e13a1b0/b2/d5/GyRgdDkM.gif',
  'https://static.klipy.com/ii/925f17378dd1893b674a723c07535afe/96/cf/x6plW89p.gif',
  'https://static.klipy.com/ii/925f17378dd1893b674a723c07535afe/7f/d6/5cNR3rym.gif',
  'https://static.klipy.com/ii/39f2394ae36df6e199be9eb7c9fa1012/8e/ba/eEttBgRK.gif',
  'https://static.klipy.com/ii/935d7ab9d8c6202580a668421940ec81/3f/27/3xsdt1z2.gif',
  'https://static.klipy.com/ii/f87f46a2c5aeaeed4c68910815f73eaf/37/fc/HtyXkxIx.gif',
  'https://static.klipy.com/ii/c3a19a0b747a76e98651f2b9a3cca5ff/5f/42/dgwH9jEu.gif',
  'https://static.klipy.com/ii/39f2394ae36df6e199be9eb7c9fa1012/96/e2/HtvOEEAj.gif',
  'https://static.klipy.com/ii/d7aec6f6f171607374b2065c836f92f4/2c/05/mr8AsPEx.gif',
  'https://static.klipy.com/ii/39f2394ae36df6e199be9eb7c9fa1012/73/09/mE0mO3K3.gif',
  'https://static.klipy.com/ii/35ccce3d852f7995dd2da910f2abd795/1c/6b/ibYUkeDj.gif',
  'https://static.klipy.com/ii/da290b156d64898341638f3c299e7478/f2/54/buWFhtUy.gif',
  'https://static.klipy.com/ii/d7aec6f6f171607374b2065c836f92f4/d5/79/oggMl8fy.gif',
  'https://static.klipy.com/ii/c3a19a0b747a76e98651f2b9a3cca5ff/12/8a/D5HwuGXM.gif',
] as const;

// ── FAQ (정적 카탈로그) ──────────────────────────────────────────────────────
const FAQ_DEFS: { q: string; a: string }[] = [
  { q: '초대장은 어떻게 만드나요?', a: '홈 화면 우측 하단의 + 버튼을 눌러 제목, 일정, 장소를 입력하면 초대장이 만들어져요.' },
  { q: '초대장 링크는 어디서 공유하나요?', a: '초대장 상세 화면의 공유 버튼을 누르면 카카오톡, 문자, 링크 복사로 게스트에게 보낼 수 있어요.' },
  { q: '참석 여부(RSVP)는 어떻게 변경하나요?', a: '초대장에 들어가 참석/미정/불참 버튼을 다시 누르면 언제든 변경돼요. 단, 마감된 초대장은 변경할 수 없어요.' },
  { q: '사진은 누가 올릴 수 있나요?', a: '해당 초대장에 참여한 게스트와 호스트 모두 사진을 올릴 수 있어요.' },
  { q: '미션 기능은 무엇인가요?', a: '호스트가 등록한 미션을 참석 게스트에게 무작위로 배정해, 모임을 더 재미있게 만들어주는 기능이에요.' },
  { q: '초대장을 마감하면 어떻게 되나요?', a: '마감하면 새로운 참여와 RSVP 변경이 막히고, 기존 참여자는 사진과 댓글을 계속 볼 수 있어요.' },
  { q: '탈퇴하면 데이터는 어떻게 되나요?', a: '탈퇴 시 회원 정보는 즉시 비활성화되며, 관련 데이터는 운영정책에 따라 일정 기간 후 삭제돼요.' },
  { q: '문의는 어디에 남기나요?', a: '설정 > 문의하기에서 유형을 선택해 남겨주시면 운영팀이 확인 후 답변드려요.' },
];

// ── Seed builder ─────────────────────────────────────────────────────────────

function buildSeeds() {
  // 1. User IDs
  const userIdByKey: Record<string, string> = {};
  for (const u of USER_DEFS) userIdByKey[u.key] = id(`user:${u.key}`);

  // 2. Users (profileImageUrl: DiceBear 기본 아바타 시드 — 외부 프로필 URL 없음)
  const users = USER_DEFS.map((u) => ({
    id: userIdByKey[u.key]!,
    email: u.email,
    profileImageUrl: profileDicebearSeed(u.key),
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

  // 5. Templates (previewImageKey: template_images URL)
  const templateIdByKey: Record<string, string> = {};
  for (const t of TEMPLATE_DEFS) templateIdByKey[t.key] = id(`template:${t.key}`);

  const templates = TEMPLATE_DEFS.map((t) => ({
    id: templateIdByKey[t.key]!,
    name: t.name,
    previewImageKey: templatePreviewFromFolder(t.previewFolder, 0, t.previewFile),
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

  // 6. Invitations (mainImageKey: template_images URL — S3Service.getPublicUrl 정적 URL 변환)
  const invIdByKey: Record<string, string> = {};
  for (const inv of INV_DEFS) invIdByKey[inv.key] = id(`invitation:${inv.key}`);

  const invitations = INV_DEFS.map((inv, i) => {
    const isGif = i % 6 === 5; // 약 17%는 gif 커버
    return {
      id: invIdByKey[inv.key]!,
      userId: userIdByKey[inv.hostKey]!,
      templateId: inv.templateKey ? templateIdByKey[inv.templateKey]! : (null as string | null),
      status: inv.status,
      title: inv.title,
      description: inv.description,
      // 커버 XOR 제약(check_cover_type_*): image면 gif=null, gif면 image_key=null
      mainCoverType: isGif ? ('gif' as const) : ('image' as const),
      mainImageKey: isGif ? (null as string | null) : invitationCoverUrl(inv.key),
      mainGifUrl: isGif ? pick(GIF_POOL, i) : (null as string | null),
      eventStartAt: inv.eventStartAt,
      isMissionEnabled: inv.isMissionEnabled,
      isPublic: false,
      category: null as string | null,
      bgColor: INVITE_BG_THEMES[i % INVITE_BG_THEMES.length]!,
    };
  });

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
    content: string; gifUrl?: string | null; likeCount: number; deletedAt: Date | null;
  }> = [];
  const feedbackLikes: Array<{ id: string; feedbackId: string; participantId: string }> = [];

  let fbGifCursor = 0; // gif 댓글에 GIF_POOL을 순환 배정

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

      // 초대장당 1개(i===1)는 gif-only 댓글 (content '' + gifUrl).
      // check_content_or_gif: gif가 있으면 content 빈 문자열 허용.
      // check_gif_xor_photo: attached_photo_id를 안 쓰므로(null) gif 단독 OK.
      const isGif = i === 1;
      feedbacks.push({
        id: fbId, participantId: authorId, invitationId: invId, photoId: null, parentId: null,
        content: isGif ? '' : pick(FEEDBACK_INV_TEMPLATES, i),
        gifUrl: isGif ? GIF_POOL[fbGifCursor++ % GIF_POOL.length]! : null,
        likeCount: likers.length, deletedAt: null,
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

  // 21. FAQ items (정적 카탈로그)
  const faqItems = FAQ_DEFS.map((f, i) => ({
    id: id(`faq:${i + 1}`),
    question: f.q,
    answer: f.a,
    sortOrder: i,
    isActive: true,
    createdBy: null as string | null,
  }));

  // 22. User term agreements (필수 약관 전원 동의 + 위치 약관 일부 동의)
  // termId는 docs/legal/*.md frontmatter의 documentId 기반 — legal-loader와 동일 규칙
  const REQUIRED_TERM_IDS = [
    id('term:service-v1.0'),
    id('term:privacy-v1.0'),
    id('term:age-v1.0'),
  ];
  const LOCATION_TERM_ID = id('term:location-v1.0');
  const AGREED_AT = new Date('2026-05-01T09:00:00Z');
  const userTermAgreements = users.flatMap((u, ui) => {
    const rows = REQUIRED_TERM_IDS.map((termId, ti) => ({
      id: id(`termagree:${u.id}:${ti}`),
      userId: u.id,
      termId,
      agreedAt: AGREED_AT,
    }));
    // 70%는 선택(위치) 약관에도 동의
    if (ui % 10 < 7) {
      rows.push({ id: id(`termagree:${u.id}:loc`), userId: u.id, termId: LOCATION_TERM_ID, agreedAt: AGREED_AT });
    }
    return rows;
  });

  // 23. Remind logs (마감된 초대장 대상 D+7 발송 로그)
  const remindLogs = invitations
    .filter((inv) => inv.status === 'closed')
    .map((inv) => ({
      id: id(`remindlog:${inv.id}:D+7`),
      invitationId: inv.id,
      remindType: 'D+7' as const,
      sentAt: new Date(inv.eventStartAt.getTime() + 7 * 86_400_000),
    }));

  // 24. AI image jobs (8번째 초대장마다 호스트가 완료한 합성 작업)
  const aiImageJobs = invitations
    .filter((_, i) => i % 8 === 0)
    .map((inv) => ({
      id: id(`aijob:${inv.id}`),
      userId: inv.userId,
      invitationId: inv.id,
      uploadedImageKey: photoUrl(`aijob-src-${inv.id}`),
      status: 'completed' as const,
      resultKey: photoUrl(`aijob-result-${inv.id}`),
      errorCode: null as string | null,
      completedAt: new Date('2026-05-15T12:00:00Z'),
    }));

  // 25. Date vote polls / slots / responses (10번째 초대장마다 1개 폴)
  const DATE_SLOTS = ['2026-07-10', '2026-07-11', '2026-07-12'] as const;
  const RESPONSE_PATTERN = ['good', 'maybe', 'bad', 'good', 'good', 'maybe', 'bad', 'good'] as const;
  const dateVotePolls: Array<{
    id: string; invitationId: string; closesAt: Date;
    status: 'open' | 'closed' | 'confirmed'; isAnonymous: boolean;
  }> = [];
  const dateVoteSlots: Array<{
    id: string; pollId: string; date: string; startTime: string | null; sortOrder: number;
  }> = [];
  const dateVoteResponses: Array<{
    id: string; slotId: string; participantId: string; response: 'good' | 'maybe' | 'bad';
  }> = [];

  invitations
    .filter((_, i) => i % 10 === 0)
    .forEach((inv) => {
      const pollId = id(`datevotepoll:${inv.id}`);
      dateVotePolls.push({
        id: pollId,
        invitationId: inv.id,
        closesAt: new Date('2026-07-05T00:00:00Z'),
        status: 'open',
        isAnonymous: false,
      });
      const invParticipants = participants.filter((p) => p.invitationId === inv.id);
      DATE_SLOTS.forEach((d, si) => {
        const slotId = id(`datevoteslot:${inv.id}:${si}`);
        dateVoteSlots.push({
          id: slotId,
          pollId,
          date: d,
          startTime: si === 0 ? null : '18:00', // 첫 슬롯은 종일
          sortOrder: si,
        });
        invParticipants.forEach((p, pi) => {
          dateVoteResponses.push({
            id: id(`datevoteresp:${slotId}:${p.id}`),
            slotId,
            participantId: p.id,
            response: pick(RESPONSE_PATTERN, si * 3 + pi),
          });
        });
      });
    });

  const publicSeeds = buildPublicInvitationSeeds({
    id,
    pick,
    take,
    userIdByKey,
    templateIdByKey,
    hostKeys: HOST_KEYS,
    guestKeys: GUEST_KEYS,
    templateCoverUrl,
    templatePhotoUrl,
    realEventLocations: REAL_EVENT_LOCATIONS,
    feedbackInvTemplates: FEEDBACK_INV_TEMPLATES,
    feedbackPhotoTemplates: FEEDBACK_PHOTO_TEMPLATES,
    replyTemplates: REPLY_TEMPLATES,
    gifPool: GIF_POOL,
    inviteBgThemes: INVITE_BG_THEMES,
    rsvpPattern: RSVP_PATTERN,
    photoLikePattern: PHOTO_LIKE_PATTERN,
    feedbackLikePattern: FEEDBACK_LIKE_PATTERN,
  });

  return {
    users,
    socialAccounts,
    notificationSettings,
    templates,
    missionTemplates,
    invitations: [...invitations, ...publicSeeds.invitations],
    participants: [...participants, ...publicSeeds.participants],
    eventLocations: [...eventLocations, ...publicSeeds.eventLocations],
    sendLogs,
    invitationLinkEvents,
    blocklists,
    participantLocations,
    missions,
    missionAssignments,
    photos: [...photos, ...publicSeeds.photos],
    photoLikes: [...photoLikes, ...publicSeeds.photoLikes],
    feedbacks: [...feedbacks, ...publicSeeds.feedbacks],
    feedbackLikes: [...feedbackLikes, ...publicSeeds.feedbackLikes],
    notifications,
    inquiries,
    faqItems,
    userTermAgreements,
    remindLogs,
    aiImageJobs,
    dateVotePolls,
    dateVoteSlots,
    dateVoteResponses,
  };
}


export const SEEDS = buildSeeds();

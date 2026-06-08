// 친구 목록 가나다 정렬 + 초성 인덱스용 헬퍼

const CHOSUNG = [
  "ㄱ", "ㄲ", "ㄴ", "ㄷ", "ㄸ", "ㄹ", "ㅁ", "ㅂ", "ㅃ", "ㅅ",
  "ㅆ", "ㅇ", "ㅈ", "ㅉ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ",
] as const;

// 쌍자음은 기본 자음 섹션으로 합침 (ㄲ → ㄱ)
const DOUBLE_TO_BASE: Record<string, string> = {
  "ㄲ": "ㄱ", "ㄸ": "ㄷ", "ㅃ": "ㅂ", "ㅆ": "ㅅ", "ㅉ": "ㅈ",
};

/** 인덱스 바에 항상 노출되는 한글 14자음 */
export const KOREAN_INITIALS = [
  "ㄱ", "ㄴ", "ㄷ", "ㄹ", "ㅁ", "ㅂ", "ㅅ", "ㅇ", "ㅈ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ",
];

const KOREAN_RANK = new Map(KOREAN_INITIALS.map((l, i) => [l, i]));

/** 이름 첫 글자의 초성 버킷: 한글 자음 | 영문 대문자 | "#"(숫자·기타) */
export function getInitial(name: string | null | undefined): string {
  const ch = name?.trim()?.[0];
  if (!ch) return "#";

  const code = ch.charCodeAt(0);
  if (code >= 0xac00 && code <= 0xd7a3) {
    const cho = CHOSUNG[Math.floor((code - 0xac00) / 588)]!;
    return DOUBLE_TO_BASE[cho] ?? cho;
  }
  if ((CHOSUNG as readonly string[]).includes(ch)) return DOUBLE_TO_BASE[ch] ?? ch;
  if (/[a-z]/i.test(ch)) return ch.toUpperCase();
  return "#";
}

function bucketRank(initial: string): number {
  const korean = KOREAN_RANK.get(initial);
  if (korean !== undefined) return korean; // 한글 0..13
  if (/[A-Z]/.test(initial)) return 100 + initial.charCodeAt(0); // 영문
  return 1000; // #
}

/** 한글(가나다) → 영문(A-Z) → # 순서로 정렬 */
export function compareByInitial(a: string | null, b: string | null): number {
  const rankA = bucketRank(getInitial(a));
  const rankB = bucketRank(getInitial(b));
  if (rankA !== rankB) return rankA - rankB;
  return (a ?? "").localeCompare(b ?? "", "ko");
}

/** 인덱스 바에 노출할 글자: 한글 14자음(항상) + 존재하는 영문 + (있으면) # */
export function buildIndexLetters(present: Set<string>): string[] {
  const latin = [...present].filter((l) => /[A-Z]/.test(l)).sort();
  const hash = present.has("#") ? ["#"] : [];
  return [...KOREAN_INITIALS, ...latin, ...hash];
}

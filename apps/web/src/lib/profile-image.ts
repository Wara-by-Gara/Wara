export const DICEBEAR_PROFILE_PREFIX = "dicebear:";

const COMPOUND_SURNAMES = ["남궁", "황보", "선우", "제갈"] as const;
const SINGLE_SURNAMES = new Set([
  "김", "이", "박", "최", "정", "강", "조", "윤", "장", "임", "한", "오",
  "서", "신", "권", "황", "안", "송", "류", "전", "홍", "고", "문", "양",
  "손", "배", "백", "허", "유", "남", "심", "노", "하",
]);

function splitGraphemes(value: string): string[] {
  const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });
  return [...segmenter.segment(value)].map((s) => s.segment);
}

/** 성(복성 포함)을 제외한 이름 부분 — 한국식 실명이 아니면 전체를 이름으로 취급 */
function extractGivenName(fullName: string): string[] {
  const graphemes = splitGraphemes(fullName.trim());
  if (graphemes.length === 0) return [];

  for (const compound of COMPOUND_SURNAMES) {
    const compoundGraphemes = splitGraphemes(compound);
    if (graphemes.length <= compoundGraphemes.length) continue;
    if (graphemes.slice(0, compoundGraphemes.length).join("") === compound) {
      return graphemes.slice(compoundGraphemes.length);
    }
  }

  const first = graphemes[0];
  if (graphemes.length >= 3 && first && SINGLE_SURNAMES.has(first)) {
    return graphemes.slice(1);
  }

  return graphemes;
}

export type AvatarInitials = {
  initials: string;
  /** 이름이 3글자일 때 오버레이 글자 크기 조정 */
  isCompact: boolean;
};

/** 아바타 오버레이 — 성 제외 이름 2글자, 이름이 3글자면 3글자 허용 */
export function getAvatarInitials(name?: string): AvatarInitials {
  if (!name?.trim()) return { initials: "", isCompact: false };

  const given = extractGivenName(name);
  if (given.length === 0) return { initials: "", isCompact: false };

  const count = given.length >= 3 ? 3 : Math.min(2, given.length);
  return {
    initials: given.slice(0, count).join(""),
    isCompact: count === 3,
  };
}

export function isDicebearProfileImage(value: string): boolean {
  return value.startsWith(DICEBEAR_PROFILE_PREFIX);
}

export function extractDicebearSeed(
  profileImageUrl: string | null | undefined,
  fallbackSeed?: string,
): string | undefined {
  if (profileImageUrl && isDicebearProfileImage(profileImageUrl)) {
    return profileImageUrl.slice(DICEBEAR_PROFILE_PREFIX.length);
  }
  return fallbackSeed;
}

/** Avatar용 — http(s)/S3 URL과 DiceBear 시드 분리 */
export function resolveAvatarDisplay(
  src: string | null | undefined,
  fallbackSeed?: string,
): { imageSrc?: string; dicebearSeed?: string } {
  if (!src) {
    return { dicebearSeed: fallbackSeed };
  }
  if (isDicebearProfileImage(src)) {
    return { dicebearSeed: src.slice(DICEBEAR_PROFILE_PREFIX.length) };
  }
  return { imageSrc: src };
}

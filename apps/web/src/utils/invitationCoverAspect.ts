/** 가로형 상한 (1.91:1) */
export const COVER_MAX_RATIO = 1.91;
/** 세로형 하한 (3:4) */
export const COVER_MIN_RATIO = 3 / 4;
/** 이미지 로드 전 기본 비율 */
export const COVER_DEFAULT_RATIO = 4 / 5;

export function clampCoverRatio(ratio: number): number {
  return Math.min(COVER_MAX_RATIO, Math.max(COVER_MIN_RATIO, ratio));
}

/** 상세 페이지 — 최대 1:1, 가로가 긴 이미지는 높이 축소 */
export const DETAIL_COVER_MAX_RATIO = 1;
export const DETAIL_COVER_MIN_RATIO = COVER_MAX_RATIO;

export function clampDetailCoverRatio(ratio: number): number {
  return Math.min(DETAIL_COVER_MIN_RATIO, Math.max(DETAIL_COVER_MAX_RATIO, ratio));
}

export function isCoverRatioOutOfBounds(ratio: number): boolean {
  return ratio > COVER_MAX_RATIO || ratio < COVER_MIN_RATIO;
}

export function loadImageNaturalRatio(src: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img.naturalWidth / img.naturalHeight);
    img.onerror = reject;
    img.src = src;
  });
}

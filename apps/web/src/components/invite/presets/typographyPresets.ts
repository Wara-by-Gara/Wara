/**
 * 타이포그래피 프리셋 — 초대장 제목/메타 글자 스타일.
 * 폰트 크기는 컨테이너 비례 단위(cqw)로 지정 → 풀사이즈·썸네일 모두 비율 유지.
 * (렌더러 stage가 @container)
 */
export interface TypographyPreset {
  title: string;
  meta: string;
  message: string;
}

export const typographyPresets = {
  modern: {
    title: "text-[10.5cqw] font-extrabold leading-[1.15] tracking-[-0.02em]",
    meta: "text-[4.2cqw] font-medium",
    message: "text-[4.2cqw] leading-relaxed",
  },
  elegant: {
    title: "text-[11cqw] font-semibold leading-[1.2] tracking-[0.01em]",
    meta: "text-[4cqw] font-normal tracking-wide",
    message: "text-[4.2cqw] leading-relaxed",
  },
  playful: {
    title: "text-[12cqw] font-black leading-[1.1] tracking-[-0.01em]",
    meta: "text-[4.4cqw] font-semibold",
    message: "text-[4.2cqw] leading-relaxed",
  },
  minimal: {
    title: "text-[8.5cqw] font-semibold leading-[1.25] tracking-[-0.01em]",
    meta: "text-[4cqw] font-normal",
    message: "text-[4cqw] leading-relaxed",
  },
  retro: {
    title: "text-[10cqw] font-black uppercase leading-[1.05] tracking-[0.04em]",
    meta: "text-[3.8cqw] font-bold uppercase tracking-[0.12em]",
    message: "text-[4cqw] leading-relaxed",
  },
} as const satisfies Record<string, TypographyPreset>;

export type TypographyPresetKey = keyof typeof typographyPresets;

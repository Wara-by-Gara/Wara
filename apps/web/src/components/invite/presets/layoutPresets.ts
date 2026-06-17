/**
 * 레이아웃 프리셋 — Content 레이어의 정렬/배치.
 * className 조합으로 표현 (Tailwind).
 */
export interface LayoutPreset {
  /** 콘텐츠 컨테이너 정렬 */
  container: string;
  /** 텍스트 정렬 */
  text: string;
}

export const layoutPresets = {
  centered: {
    container: "items-center justify-center text-center",
    text: "items-center text-center",
  },
  bottomLeft: {
    container: "items-start justify-end text-left",
    text: "items-start text-left",
  },
  topCenter: {
    container: "items-center justify-start pt-[14%] text-center",
    text: "items-center text-center",
  },
} as const satisfies Record<string, LayoutPreset>;

export type LayoutPresetKey = keyof typeof layoutPresets;

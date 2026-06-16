import type { CSSProperties } from "react";

export interface OverlayParams {
  /** 불투명도 0~1 */
  strength?: number;
}

/**
 * 오버레이 프리셋 — 콘텐츠 가독성 확보용 스크림/비네트.
 * Background와 Content 사이(Motion 위)에 깔린다.
 */
type OverlayBuilder = (params?: OverlayParams) => CSSProperties;

export const overlayPresets = {
  none: () => ({ display: "none" }),

  /** 하단 어둡게 — 밝은 사진/그라데이션 위 흰 텍스트 */
  bottomScrim: (params) => ({
    background: `linear-gradient(to top, rgba(0,0,0,${params?.strength ?? 0.55}) 0%, transparent 55%)`,
  }),

  /** 전체 살짝 어둡게 */
  dim: (params) => ({
    background: `rgba(0,0,0,${params?.strength ?? 0.28})`,
  }),

  /** 가장자리 비네트 */
  vignette: (params) => ({
    background: `radial-gradient(circle at 50% 45%, transparent 55%, rgba(0,0,0,${params?.strength ?? 0.4}) 100%)`,
  }),
} as const satisfies Record<string, OverlayBuilder>;

export type OverlayPresetKey = keyof typeof overlayPresets;

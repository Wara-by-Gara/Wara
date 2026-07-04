/**
 * 글래스모피즘 토큰 — 반투명 surface + backdrop blur + 글래스 보더.
 * RSVP·하단 액션·칩·바텀시트 등 라이트 화면 핵심 표현.
 */
import type { ThemeMode } from "./colors.ts";

export const glass: Record<ThemeMode, Record<string, string>> = {
  light: {
    "surface-glass": "rgba(255,255,255,0.60)",
    "surface-glass-strong": "rgba(255,255,255,0.78)",
    "glass-border": "rgba(255,255,255,0.45)",
    // iOS 26 Liquid Glass 모방 (앱 크롬 리스킨) — 모바일 네이티브 UIGlassEffect 톤 미러
    "surface-lglass": "rgba(255,255,255,0.55)",
    "surface-lglass-strong": "rgba(250,250,252,0.78)",
    "lglass-border": "rgba(255,255,255,0.70)",
    "lglass-shadow": "rgba(22,19,31,0.14)",
  },
  dark: {
    "surface-glass": "rgba(28,24,40,0.55)",
    "surface-glass-strong": "rgba(32,27,46,0.72)",
    "glass-border": "rgba(255,255,255,0.12)",
    "surface-lglass": "rgba(30,30,34,0.55)",
    "surface-lglass-strong": "rgba(38,38,42,0.78)",
    "lglass-border": "rgba(255,255,255,0.18)",
    "lglass-shadow": "rgba(0,0,0,0.45)",
  },
};

export const blur = {
  glass: "16px",
  "glass-strong": "24px",
  // iOS 26 Liquid Glass — 채도 부스트와 조합해 사용 (backdrop-filter: blur() saturate())
  lglass: "20px",
} as const;

/** Liquid Glass backdrop 채도 부스트 배율 */
export const lglassSaturate = "1.8" as const;

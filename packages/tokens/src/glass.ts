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
  },
  dark: {
    "surface-glass": "rgba(28,24,40,0.55)",
    "surface-glass-strong": "rgba(32,27,46,0.72)",
    "glass-border": "rgba(255,255,255,0.12)",
  },
};

export const blur = {
  glass: "16px",
  "glass-strong": "24px",
} as const;

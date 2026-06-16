/** 그림자 — 라이트는 부드러운 보라빛 그림자, 다크는 약한 그림자(위계는 surface 명도로). */
import type { ThemeMode } from "./colors.ts";

export const shadow: Record<ThemeMode, Record<string, string>> = {
  light: {
    xs: "0 1px 2px rgba(20,18,26,0.06)",
    sm: "0 2px 6px rgba(20,18,26,0.08)",
    md: "0 6px 16px rgba(20,18,26,0.10)",
    lg: "0 12px 28px rgba(20,18,26,0.12)",
    xl: "0 24px 48px rgba(20,18,26,0.16)",
  },
  dark: {
    xs: "0 1px 2px rgba(0,0,0,0.30)",
    sm: "0 2px 6px rgba(0,0,0,0.36)",
    md: "0 6px 16px rgba(0,0,0,0.44)",
    lg: "0 12px 28px rgba(0,0,0,0.52)",
    xl: "0 24px 48px rgba(0,0,0,0.60)",
  },
};

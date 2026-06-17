/** 그림자 — 라이트는 부드러운 보라빛 그림자, 다크는 약한 그림자(위계는 surface 명도로). */
import type { ThemeMode } from "./colors.ts";

export const shadow: Record<ThemeMode, Record<string, string>> = {
  light: {
    xs: "0 1px 2px rgba(20,18,26,0.06)",
    sm: "0 2px 6px rgba(20,18,26,0.08)",
    md: "0 6px 16px rgba(20,18,26,0.10)",
    lg: "0 12px 28px rgba(20,18,26,0.12)",
    xl: "0 24px 48px rgba(20,18,26,0.16)",
    // 앱 셸 전용 시맨틱 그림자 — 4~8% 중립 잉크(컬러 그림자 없음). 초대장 캔버스는 위 xs~xl·글로우 사용.
    card: "0 1px 3px rgba(20,18,26,0.04), 0 4px 12px rgba(20,18,26,0.06)",
    hover: "0 2px 6px rgba(20,18,26,0.06), 0 8px 20px rgba(20,18,26,0.08)",
    modal: "0 8px 32px rgba(20,18,26,0.08)",
  },
  dark: {
    xs: "0 1px 2px rgba(0,0,0,0.30)",
    sm: "0 2px 6px rgba(0,0,0,0.36)",
    md: "0 6px 16px rgba(0,0,0,0.44)",
    lg: "0 12px 28px rgba(0,0,0,0.52)",
    xl: "0 24px 48px rgba(0,0,0,0.60)",
    card: "0 1px 3px rgba(0,0,0,0.40)",
    hover: "0 4px 12px rgba(0,0,0,0.48)",
    modal: "0 12px 32px rgba(0,0,0,0.56)",
  },
};

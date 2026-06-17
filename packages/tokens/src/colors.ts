/**
 * 컬러 토큰 — 보라–핑크 네오-팝.
 * primitives(색 스케일) → semantic(역할 기반, light/dark) 2계층.
 * 텍스트/배경 대비는 WCAG AA 기준(본문 4.5:1, 큰 텍스트 3:1)을 만족하도록 선정.
 */

export const colorPrimitives = {
  // 브랜드 (보라)
  purple: {
    50: "#F4F0FE",
    100: "#E9E0FD",
    200: "#D3C2FB",
    300: "#B79AF7",
    400: "#9669F2",
    500: "#6D3BEB",
    600: "#5A2BD0",
    700: "#4A22AC",
    800: "#3D1E88",
    900: "#2E1763",
  },
  // 강조 (핑크)
  pink: {
    50: "#FFF0F5",
    100: "#FFE0EB",
    200: "#FFC2D8",
    300: "#FF94B8",
    400: "#FF6FA3",
    500: "#FF4D8D",
    600: "#E63578",
    700: "#C71F61",
    800: "#A1164D",
    900: "#7A1039",
  },
  // 뉴트럴 (보라빛 잉크/그레이)
  neutral: {
    0: "#FFFFFF",
    50: "#F7F6FA",
    100: "#F0EEF4",
    200: "#E4E1EC",
    300: "#D8D4E0",
    400: "#A8A3B3",
    500: "#807A8C",
    600: "#6B6577",
    700: "#4A4556",
    800: "#2A2536",
    900: "#16131F",
    950: "#0C0A12",
  },
  green: { 400: "#34D399", 500: "#22C55E", 600: "#16A34A" },
  amber: { 400: "#FBBF24", 500: "#F59E0B", 600: "#D97706" },
  red: { 400: "#F87171", 500: "#EF4444", 600: "#DC2626" },
  blue: { 400: "#60A5FA", 500: "#3B82F6", 600: "#2563EB" },
} as const;

export type ThemeMode = "light" | "dark";

/** 역할 기반 시맨틱 컬러 — 컴포넌트는 이 키만 소비한다. */
export const semanticColors: Record<ThemeMode, Record<string, string>> = {
  light: {
    background: "#FFFFFF",
    surface: "#FFFFFF",
    "surface-muted": "#F5F4F8",
    "surface-inverse": "#16131F",

    text: "#14121A",
    "text-muted": "#6B6577",
    "text-disabled": "#A8A3B3",
    "text-inverse": "#FFFFFF",
    "text-on-primary": "#FFFFFF",
    "text-on-accent": "#FFFFFF",

    border: "#ECEAF1",
    "border-strong": "#D8D4E0",

    // 메인 컬러는 보라가 아닌 중립(잉크). 강조는 그라데이션/글래스로.
    primary: "#14121A",
    "primary-strong": "#000000",
    "primary-soft": "#F0EEF4",
    // 그라데이션/사진 위 CTA용 화이트 pill
    "btn-primary-bg": "#FFFFFF",
    "btn-primary-fg": "#14121A",
    accent: "#FF4D8D",
    "accent-soft": "#FFE0EB",

    success: "#16A34A",
    "success-soft": "#DCFCE7",
    warning: "#D97706",
    "warning-soft": "#FEF3C7",
    danger: "#DC2626",
    "danger-soft": "#FEE2E2",
    info: "#2563EB",
    "info-soft": "#DBEAFE",
    // 인터랙티브 텍스트/링크 (Partiful: Save·Party Genie·링크 = 블루)
    link: "#1D6FE0",
    "link-soft": "#E8F0FE",
  },
  dark: {
    background: "#0C0A12",
    surface: "#16131F",
    "surface-muted": "#1F1B2B",
    "surface-inverse": "#F4F1FA",

    text: "#F4F1FA",
    "text-muted": "#ADA6BD",
    "text-disabled": "#6E6880",
    "text-inverse": "#14121A",
    "text-on-primary": "#FFFFFF",
    "text-on-accent": "#1A0E14",

    border: "#2A2536",
    "border-strong": "#3A3348",

    primary: "#F4F1FA",
    "primary-strong": "#FFFFFF",
    "primary-soft": "rgba(255,255,255,0.08)",
    "btn-primary-bg": "#FFFFFF",
    "btn-primary-fg": "#14121A",
    accent: "#FF6FA3",
    "accent-soft": "rgba(255,111,163,0.18)",

    success: "#34D399",
    "success-soft": "rgba(52,211,153,0.16)",
    warning: "#FBBF24",
    "warning-soft": "rgba(251,191,36,0.16)",
    danger: "#F87171",
    "danger-soft": "rgba(248,113,113,0.16)",
    info: "#60A5FA",
    "info-soft": "rgba(96,165,250,0.16)",
    link: "#5B9DFF",
    "link-soft": "rgba(91,157,255,0.16)",
  },
};

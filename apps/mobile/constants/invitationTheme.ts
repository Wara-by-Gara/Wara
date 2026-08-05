/**
 * 초대장 배경 테마 상수 — 웹 미러.
 *
 * SoT:
 * - apps/web/src/domain/InvitationCreate/constants.ts (DESIGN_BG_THEMES / GRADIENT_BG_VARIANTS / getGradientVariant)
 * - apps/web/src/utils/resolveInvitationBgClass.ts (bgColor → 테마 매핑)
 * - apps/web/src/domain/InvitationDetail/Container/GuestView.tsx (isDarkBg 판정)
 * - apps/web/src/domain/InvitationDetail/types.ts (FONT_CLASS)
 *
 * 초대장 캔버스 색상이라 hex 허용 (mobile CLAUDE.md 예외).
 */

import type { TextStyle } from 'react-native';

/* ---------- 배경: 테마 id (웹 DESIGN_BG_THEMES.cls 의 `bg-invite-` 접미사) ---------- */
export const INVITE_BG_THEME_IDS = [
  'minimal',
  'pastel',
  'sky',
  'glass',
  'y2k',
  'flower',
  'film',
  'aurora',
  'checkdot',
  'starry',
  'dreamy',
  'galaxy',
  'water',
  'hologram',
  'lasershow',
  'blackcat',
  'masterpiece',
] as const;

export type InviteBgThemeId = (typeof INVITE_BG_THEME_IDS)[number];

const BG_CLASS_PREFIX = 'bg-invite-';
const GRAD_CLASS_PREFIX = 'bg-invite-grad-';

/* ---------- 배경: 애니메이션 그라데이션 변형 (웹 GRADIENT_BG_VARIANTS 1:1) ---------- */
export const GRADIENT_BG_VARIANTS = [
  { id: 'sunset', label: '선셋', c1: '#ff7e5f', c2: '#feb47b' },
  { id: 'ocean', label: '바다', c1: '#87ceeb', c2: '#0288d1' },
  { id: 'lightning', label: '번개', c1: '#191c38', c2: '#23294e' },
  { id: 'soccer', label: '축구', c1: '#2e8020', c2: '#1d5a12' },
] as const;

export type GradientVariant = (typeof GRADIENT_BG_VARIANTS)[number];

/** GradientVariant + 커스텀(hue 피커) 공용 최소 형태 */
export interface GradientColors {
  id: string;
  label: string;
  c1: string;
  c2: string;
}

const CUSTOM_GRADIENT_ID = 'custom';
const CUSTOM_GRADIENT_RE = /^custom-([0-9a-f]{6})-([0-9a-f]{6})$/;

/** bgColor 문자열 → 그라데이션 변형 (아니면 undefined) — 웹 getGradientVariant 미러 (커스텀 hue 인코딩 포함) */
export function getGradientVariant(bg?: string | null): GradientColors | undefined {
  if (!bg?.startsWith(GRAD_CLASS_PREFIX)) return undefined;
  const id = bg.slice(GRAD_CLASS_PREFIX.length);
  const customMatch = id.match(CUSTOM_GRADIENT_RE);
  if (customMatch) {
    return { id: CUSTOM_GRADIENT_ID, label: '커스텀', c1: `#${customMatch[1]}`, c2: `#${customMatch[2]}` };
  }
  return GRADIENT_BG_VARIANTS.find((v) => v.id === id);
}

/** bgColor 문자열 → 테마 id (그라데이션 변형이거나 미매핑이면 undefined) */
export function resolveInvitationBgTheme(bgColor?: string | null): InviteBgThemeId | undefined {
  if (!bgColor || getGradientVariant(bgColor)) return undefined;
  if (!bgColor.startsWith(BG_CLASS_PREFIX)) return undefined;
  const id = bgColor.slice(BG_CLASS_PREFIX.length);
  return INVITE_BG_THEME_IDS.find((t) => t === id);
}

/* ---------- 다크 배경 판정 (웹 GuestView isDarkBg 미러) ---------- */
const DARK_BG_KEYWORDS = ['aurora', 'starry', 'dreamy', 'galaxy', 'lasershow'] as const;

/** named 그라데이션 4종 + aurora/starry/dreamy/galaxy/lasershow 는 다크 배경.
 * custom(hue 피커)은 가운데가 밝은 radial이라 제외. */
export function isDarkInvitationBg(bgColor: string): boolean {
  const gradientVariant = getGradientVariant(bgColor);
  return (
    (!!gradientVariant && gradientVariant.id !== 'custom') ||
    DARK_BG_KEYWORDS.some((k) => bgColor.includes(k))
  );
}

/* ---------- 제목 폰트 (웹 FONT_CLASS 미러 — 커스텀 폰트 미번들, iOS 시스템 근사) ---------- */
export const INVITATION_FONT_STYLES: Record<string, TextStyle> = {
  // 레거시 (기존 초대장 호환)
  default: {},
  gothic: { fontWeight: '700', letterSpacing: -0.8 },
  serif: { fontFamily: 'Georgia' },
  mono: { fontFamily: 'Menlo' },
  // 초대장 제목 폰트 (docs/font.md + Pretendard) — 시스템 폰트 근사
  pretendard: {},
  'elegant-serif': { fontFamily: 'Baskerville' },
  jiptokki: { fontFamily: 'MarkerFelt-Thin' },
  'partial-sans': { fontWeight: '800', letterSpacing: -0.4 },
  silla: { fontWeight: '600', letterSpacing: 0.6 },
  highteen: { fontWeight: '700', letterSpacing: 0.2 },
  dos: { fontFamily: 'Noteworthy-Light' },
  moonhalo: { fontFamily: 'Georgia', fontStyle: 'italic' },
};

/** 미지정/미매핑 폰트는 시스템 기본 (웹 `font-sans` 폴백 미러) */
export function invitationFontStyle(font: string): TextStyle {
  return INVITATION_FONT_STYLES[font] ?? {};
}

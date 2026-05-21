/**
 * Wara 디자인 토큰 — 모바일 (RN/Expo).
 *
 * SoT: `apps/web/src/styles/DESIGN.md` + `apps/web/src/app/globals.css`
 *      → Figma "Wara" file (https://www.figma.com/design/2XKYD3FPcHwgeGgCih2uVu/Wara)
 *
 * 본 파일은 web `globals.css`의 `@theme {}` 블록과 값 1:1 일치를 유지함.
 * 토큰 추가/변경은 web에서 먼저 결정 후 본 파일 미러링 — 절대 mobile 단독 결정 금지.
 *
 * 미러링 안 하는 것:
 * - web `globals.css`의 "Legacy WARA Brand Colors" 섹션(`--color-wara-primary`,
 *   `--color-wara-bg`, `--color-wara-secondary` 등) — PR #69 이전 디자인의 잔재.
 *   새 디자인 시스템(pink/sky/yellow semantic)만 SoT로 인정.
 *
 * 사용:
 *   import { colors, radius, shadow, spacing, typography } from '@/constants/tokens';
 *   const styles = StyleSheet.create({
 *     card: { backgroundColor: colors.surface, borderRadius: radius.lg, ...shadow.sm },
 *   });
 */

// ── Primitive Colors ────────────────────────────────────────────────────────
export const palette = {
  white: '#ffffff',
  black: '#171717',

  gray50: '#fafafa',
  gray100: '#f5f5f5',
  gray200: '#eaeaea',
  gray300: '#d4d4d4',
  gray400: '#a3a3a3',
  gray500: '#737373',
  gray600: '#525252',
  gray700: '#404040',
  gray800: '#262626',
  gray900: '#171717',

  pink50: '#fff1f7',
  pink100: '#ffe1ef',
  pink200: '#ffc4df',
  pink300: '#ff9aca',
  pink400: '#ff6db3',
  pink500: '#ff4fa3',
  pink600: '#e7358c',

  sky50: '#eef8ff',
  sky100: '#ddf1ff',
  sky200: '#bde6ff',
  sky300: '#8dd4ff',
  sky400: '#5bc1ff',
  sky500: '#2ea8f5',

  yellow50: '#fffbea',
  yellow100: '#fff3bf',
  yellow200: '#ffe47a',
  yellow300: '#ffd43b',
  yellow400: '#fab005',

  mint50: '#edfff8',
  mint100: '#d3fbea',
  mint200: '#a8f0d2',
  mint300: '#6ee7b7',
  mint400: '#34d399',

  red50: '#fff1f2',
  red100: '#ffe4e6',
  red500: '#f43f5e',
  red600: '#e11d48',

  green50: '#f0fdf4',
  green100: '#dcfce7',
  green500: '#22c55e',
  green600: '#16a34a',
} as const;

// ── Semantic Colors (라이트 테마 기준) ──────────────────────────────────────
// DESIGN.md 3.3 — "전체 배경은 White, 카드 White, 포인트는 Pink/Sky/Yellow"
export const colors = {
  background: palette.white,
  backgroundSoft: palette.gray50,
  surface: palette.white,
  surfacePastel: palette.pink50,

  primary: palette.pink500,
  primaryHover: palette.pink600,
  primarySoft: palette.pink100,

  secondary: palette.sky400,
  secondarySoft: palette.sky100,

  accent: palette.yellow300,
  accentSoft: palette.yellow100,

  success: palette.green500,
  successSoft: palette.green50,

  danger: palette.red500,
  dangerSoft: palette.red50,

  textPrimary: palette.gray900,
  textSecondary: palette.gray600,
  textTertiary: palette.gray400,
  textInverse: palette.white,
  textInactive: palette.gray300,

  border: palette.gray200,
  borderStrong: palette.gray300,

  iconDefault: palette.gray700,
  iconPrimary: palette.pink500,
  iconInactive: palette.gray300,
  iconDanger: palette.red500,
  iconInverse: palette.white,
} as const;

// ── Radius (DESIGN.md §7) ───────────────────────────────────────────────────
export const radius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  full: 999,
} as const;

// ── Shadow (RN 호환 — iOS shadowOffset/Radius/Opacity + Android elevation) ──
// DESIGN.md §8 — web의 `shadow-xs/sm/md/lg`를 RN 등가로 변환.
// elevation은 Android 전용, iOS는 무시.
export const shadow = {
  xs: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 32,
    elevation: 8,
  },
} as const;

// ── Spacing (DESIGN.md §6, 4px 기반) ────────────────────────────────────────
export const spacing = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
} as const;

// ── Border (DESIGN.md §9) ───────────────────────────────────────────────────
export const border = {
  thin: 1,
  medium: 1.5,
  thick: 2,
} as const;

// ── Icon Size (DESIGN.md primitives) ────────────────────────────────────────
export const iconSize = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
} as const;

// ── Typography (DESIGN.md §5) ───────────────────────────────────────────────
// 모바일은 RN style 객체로 fontSize/lineHeight/fontWeight 직접 사용.
// fontFamily는 expo-font로 별도 로드 필요 (auth-kakao/스플래시 PR에서 도입 예정).
export const typography = {
  display1:    { fontSize: 32, lineHeight: 40, fontWeight: '800' as const },
  display2:    { fontSize: 28, lineHeight: 36, fontWeight: '800' as const },
  heading1:    { fontSize: 24, lineHeight: 32, fontWeight: '700' as const },
  heading2:    { fontSize: 22, lineHeight: 30, fontWeight: '700' as const },
  heading3:    { fontSize: 20, lineHeight: 28, fontWeight: '700' as const },
  title1:      { fontSize: 18, lineHeight: 26, fontWeight: '700' as const },
  title2:      { fontSize: 17, lineHeight: 24, fontWeight: '600' as const },
  body1:       { fontSize: 16, lineHeight: 24, fontWeight: '400' as const },
  body2:       { fontSize: 15, lineHeight: 22, fontWeight: '400' as const },
  body3:       { fontSize: 14, lineHeight: 20, fontWeight: '400' as const },
  caption1:    { fontSize: 13, lineHeight: 18, fontWeight: '400' as const },
  caption2:    { fontSize: 12, lineHeight: 16, fontWeight: '400' as const },
  buttonLarge: { fontSize: 16, lineHeight: 22, fontWeight: '700' as const },
  buttonMedium:{ fontSize: 15, lineHeight: 20, fontWeight: '700' as const },
  buttonSmall: { fontSize: 13, lineHeight: 18, fontWeight: '700' as const },
} as const;

// ── Safe Area / Layout (DESIGN.md §2) ───────────────────────────────────────
export const layout = {
  safeAreaTop: 44,
  safeAreaBottom: 34,
  pagePadding: 20,
  pagePaddingNarrow: 16,
  sectionGap: 32,
  cardPadding: 16,
  cardPaddingLarge: 20,
  minTouchTarget: 44, // DESIGN.md 10.1 — 접근성 최소 터치 영역
} as const;

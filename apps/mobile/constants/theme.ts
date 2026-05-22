/**
 * `useColorScheme` + `useThemeColor` 훅이 참조하는 라이트/다크 컬러 맵.
 * 값 자체는 `constants/tokens.ts` (web `globals.css` SoT 미러)를 사용.
 *
 * 다크 모드는 DESIGN.md에서 별도 정의 안 됨 — 임시로 라이트 토큰의 반전 매핑.
 * 정식 다크 토큰은 디자인팀 결정 후 본 파일 + tokens.ts 동시 갱신.
 */

import { Platform } from 'react-native';

import { colors, palette } from './tokens';

export const Colors = {
  light: {
    text: colors.textPrimary,
    background: colors.background,
    tint: colors.primary,
    icon: colors.iconDefault,
    tabIconDefault: colors.iconInactive,
    tabIconSelected: colors.primary,
  },
  dark: {
    // 다크 모드 — DESIGN.md에 별도 토큰 없음. 라이트의 반전 매핑(임시).
    // 디자인팀 다크 토큰 확정 시 tokens.ts에 colorsDark export 추가 후 본 매핑 갱신.
    text: palette.gray100,
    background: palette.gray900,
    tint: palette.pink400,
    icon: palette.gray400,
    tabIconDefault: palette.gray600,
    tabIconSelected: palette.pink400,
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

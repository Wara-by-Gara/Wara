/**
 * React Native(Expo)용 flat 토큰 export.
 * 웹 CSS와 동일 소스에서 파생 — 색은 hex/rgba, 치수는 px 숫자.
 * (RN에서 backdrop blur·gradient는 별도 컴포넌트로 처리; 여기선 raw 값만 제공)
 */
import { semanticColors, type ThemeMode } from "./colors.ts";
import { gradient } from "./gradient.ts";
import { glass, blur } from "./glass.ts";
import { typeScale, fontFamily } from "./typography.ts";
import { spacingPx, spacingSemanticPx } from "./spacing.ts";
import { radiusPx } from "./radius.ts";
import { shadow } from "./shadow.ts";
import { duration, easing } from "./motion.ts";
import { zIndex } from "./zIndex.ts";
import { iconSizePx } from "./iconSize.ts";

export const nativeTheme = (mode: ThemeMode) => ({
  color: { ...semanticColors[mode], ...glass[mode] },
  gradient: gradient[mode],
  blur,
  typography: typeScale,
  fontFamily,
  spacing: spacingPx,
  spacingSemantic: spacingSemanticPx,
  radius: radiusPx,
  shadow: shadow[mode],
  duration,
  easing,
  zIndex,
  iconSize: iconSizePx,
});

export const lightTheme = nativeTheme("light");
export const darkTheme = nativeTheme("dark");

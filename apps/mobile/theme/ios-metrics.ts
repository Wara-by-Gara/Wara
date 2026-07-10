/**
 * iOS 레이아웃 메트릭 (앱 크롬 SoT) — spacing / radius / hairline / 터치타깃.
 * iOS HIG 기준값. 컬러/타이포와 함께 `@/theme`에서 재노출.
 */

import { StyleSheet } from 'react-native';

/** 4pt 기반 spacing 스케일. */
export const iosSpacing = {
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

/** 코너 radius. iOS의 continuous-corner 느낌을 위해 카드는 md~lg 사용. */
export const iosRadius = {
  xs: 6,
  sm: 8,
  md: 10,
  lg: 12,
  xl: 16,
  '2xl': 20,
  full: 999,
} as const;

export const iosMetrics = {
  spacing: iosSpacing,
  radius: iosRadius,
  /** 1px 구분선 (레티나 hairline). */
  hairline: StyleSheet.hairlineWidth,
  /** iOS 표준 좌우 마진 16pt. */
  pagePadding: 16,
  /** grouped inset 리스트 좌우 인셋. */
  groupedInset: 16,
  /** grouped 섹션 상단 여백. */
  groupedSectionGap: 35,
  /** 리스트 row 최소 높이 (44pt 접근성 최소). */
  rowMinHeight: 44,
  /** 접근성 최소 터치 영역. */
  minTouchTarget: 44,
} as const;

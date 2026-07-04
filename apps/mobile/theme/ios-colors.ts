/**
 * iOS 시스템 시맨틱 컬러 (앱 크롬 SoT).
 *
 * `PlatformColor`는 UIKit 시스템 컬러를 그대로 참조하므로 라이트/다크·접근성 대비를
 * **OS가 자동 처리**한다 (JS 다크모드 분기 불필요). 앱 크롬(네비/탭/리스트/폼/텍스트/배경)은
 * 반드시 이 팔레트를 사용한다.
 *
 * 글로벌 틴트 = `systemBlue`.
 *
 * ⚠️ 경계 예외 — `PlatformColor` 값은 네이티브 opaque 객체라 아래에는 넘길 수 없다:
 *   - Reanimated worklet (색 보간)
 *   - Kakao WebView (HTML/CSS 문자열)
 *   - 초대장 캔버스 렌더러
 * 이 경계에서는 `iosHex`(라이트/다크 hex 폴백)를 `useColorScheme()`과 함께 사용한다.
 */

import { PlatformColor, type ColorValue } from 'react-native';

/** iOS 시스템 시맨틱 컬러 (PlatformColor). 앱 크롬 전용. */
export const ios = {
  // 배경 (일반 계층)
  systemBackground: PlatformColor('systemBackground'),
  secondarySystemBackground: PlatformColor('secondarySystemBackground'),
  tertiarySystemBackground: PlatformColor('tertiarySystemBackground'),

  // 배경 (grouped — 설정형 테이블뷰)
  systemGroupedBackground: PlatformColor('systemGroupedBackground'),
  secondarySystemGroupedBackground: PlatformColor('secondarySystemGroupedBackground'),
  tertiarySystemGroupedBackground: PlatformColor('tertiarySystemGroupedBackground'),

  // 라벨 (텍스트)
  label: PlatformColor('label'),
  secondaryLabel: PlatformColor('secondaryLabel'),
  tertiaryLabel: PlatformColor('tertiaryLabel'),
  quaternaryLabel: PlatformColor('quaternaryLabel'),
  placeholderText: PlatformColor('placeholderText'),

  // 구분선
  separator: PlatformColor('separator'),
  opaqueSeparator: PlatformColor('opaqueSeparator'),

  // 채움 (컨트롤 배경 등)
  systemFill: PlatformColor('systemFill'),
  secondarySystemFill: PlatformColor('secondarySystemFill'),
  tertiarySystemFill: PlatformColor('tertiarySystemFill'),
  quaternarySystemFill: PlatformColor('quaternarySystemFill'),

  // 강조 / 상태
  tint: PlatformColor('systemBlue'),
  systemBlue: PlatformColor('systemBlue'),
  systemRed: PlatformColor('systemRed'),
  systemGreen: PlatformColor('systemGreen'),
  systemOrange: PlatformColor('systemOrange'),
  systemYellow: PlatformColor('systemYellow'),
  link: PlatformColor('link'),

  // 그레이 스케일
  systemGray: PlatformColor('systemGray'),
  systemGray2: PlatformColor('systemGray2'),
  systemGray3: PlatformColor('systemGray3'),
  systemGray4: PlatformColor('systemGray4'),
  systemGray5: PlatformColor('systemGray5'),
  systemGray6: PlatformColor('systemGray6'),
} satisfies Record<string, ColorValue>;

/**
 * hex 폴백 — `PlatformColor`를 못 쓰는 경계(WebView·Reanimated·초대장 캔버스)용.
 * iOS 시스템 컬러의 표준 라이트/다크 값. `useColorScheme()`으로 분기해 사용.
 */
export const iosHex = {
  light: {
    systemBackground: '#FFFFFF',
    secondarySystemBackground: '#F2F2F7',
    tertiarySystemBackground: '#FFFFFF',
    systemGroupedBackground: '#F2F2F7',
    secondarySystemGroupedBackground: '#FFFFFF',
    label: '#000000',
    secondaryLabel: '#3C3C43', // 60% 불투명 근사
    tertiaryLabel: '#3C3C43',
    separator: '#C6C6C8',
    tint: '#007AFF',
    systemRed: '#FF3B30',
    systemGreen: '#34C759',
    systemOrange: '#FF9500',
  },
  dark: {
    systemBackground: '#000000',
    secondarySystemBackground: '#1C1C1E',
    tertiarySystemBackground: '#2C2C2E',
    systemGroupedBackground: '#000000',
    secondarySystemGroupedBackground: '#1C1C1E',
    label: '#FFFFFF',
    secondaryLabel: '#EBEBF5',
    tertiaryLabel: '#EBEBF5',
    separator: '#38383A',
    tint: '#0A84FF',
    systemRed: '#FF453A',
    systemGreen: '#30D158',
    systemOrange: '#FF9F0A',
  },
} as const;

export type IosHexToken = keyof typeof iosHex.light;

/** 현재 컬러 스킴의 hex 폴백을 반환 (WebView/캔버스 경계용). */
export function resolveIosHex(
  scheme: 'light' | 'dark' | null | undefined,
): Record<IosHexToken, string> {
  return scheme === 'dark' ? iosHex.dark : iosHex.light;
}

/**
 * iOS 타이포그래피 (앱 크롬 SoT) — San Francisco + Dynamic Type.
 *
 * - iOS의 시스템 폰트(SF)는 `fontFamily`를 지정하지 않으면 자동 적용된다.
 * - RN `<Text>`는 `allowFontScaling`(기본 true) 상태에서 사용자 텍스트 크기 설정에 따라
 *   `fontSize`를 **자동 스케일**한다. 따라서 여기서 크기를 직접 곱하지 않는다.
 * - `lineHeight`는 스케일되지 않아 큰 글자에서 클리핑되므로 **의도적으로 지정하지 않는다**
 *   (SF의 자연스러운 줄 높이를 사용, Dynamic Type 존중).
 *
 * 값은 iOS HIG의 실제 텍스트 스타일 메트릭(Large/기본 크기 기준).
 */

import type { TextStyle } from 'react-native';

type IosTextStyle = Pick<TextStyle, 'fontSize' | 'fontWeight' | 'letterSpacing'>;

export const iosType = {
  largeTitle: { fontSize: 34, fontWeight: '700' },
  title1: { fontSize: 28, fontWeight: '400' },
  title2: { fontSize: 22, fontWeight: '400' },
  title3: { fontSize: 20, fontWeight: '400' },
  headline: { fontSize: 17, fontWeight: '600' },
  body: { fontSize: 17, fontWeight: '400' },
  callout: { fontSize: 16, fontWeight: '400' },
  subhead: { fontSize: 15, fontWeight: '400' },
  footnote: { fontSize: 13, fontWeight: '400' },
  caption1: { fontSize: 12, fontWeight: '400' },
  caption2: { fontSize: 11, fontWeight: '400' },
} satisfies Record<string, IosTextStyle>;

export type IosTypeToken = keyof typeof iosType;

/**
 * 한글 중심 타이포그래피.
 * 영어 레퍼런스보다 줄간격을 넉넉히, 자간은 과하게 좁히지 않음.
 */

export const fontFamily = {
  sans: "'Pretendard', -apple-system, BlinkMacSystemFont, system-ui, sans-serif",
  // 초대장 타이틀 등 display는 invite 엔진에서 템플릿별로 오버라이드
  display:
    "'Pretendard', -apple-system, BlinkMacSystemFont, system-ui, sans-serif",
} as const;

export type TextVariant =
  | "display"
  | "title"
  | "sectionTitle"
  | "cardTitle"
  | "bodyLarge"
  | "body"
  | "bodySmall"
  | "caption"
  | "button"
  | "badge";

export interface TypeStyle {
  /** px */
  size: number;
  weight: number;
  lineHeight: number;
  /** em */
  letterSpacing: number;
}

export const typeScale: Record<TextVariant, TypeStyle> = {
  display: { size: 40, weight: 800, lineHeight: 1.1, letterSpacing: -0.03 },
  title: { size: 30, weight: 800, lineHeight: 1.18, letterSpacing: -0.025 },
  sectionTitle: {
    size: 22,
    weight: 700,
    lineHeight: 1.3,
    letterSpacing: -0.02,
  },
  cardTitle: { size: 18, weight: 700, lineHeight: 1.4, letterSpacing: -0.01 },
  bodyLarge: { size: 17, weight: 400, lineHeight: 1.55, letterSpacing: -0.005 },
  body: { size: 16, weight: 400, lineHeight: 1.55, letterSpacing: 0 },
  bodySmall: { size: 14, weight: 400, lineHeight: 1.5, letterSpacing: 0 },
  caption: { size: 12, weight: 400, lineHeight: 1.45, letterSpacing: 0 },
  button: { size: 15, weight: 600, lineHeight: 1.2, letterSpacing: -0.005 },
  badge: { size: 12, weight: 600, lineHeight: 1.2, letterSpacing: 0 },
};

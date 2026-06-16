/** 4pt 그리드 스페이싱. 키는 px/4 (Tailwind 관례와 호환). 값은 px 숫자(native)·rem(web). */

const px = (n: number) => n;

export const spacingPx = {
  0: px(0),
  0.5: px(2),
  1: px(4),
  2: px(8),
  3: px(12),
  4: px(16),
  5: px(20),
  6: px(24),
  8: px(32),
  10: px(40),
  12: px(48),
  16: px(64),
  20: px(80),
} as const;

/** 의미적 스페이싱 (레이아웃 규칙) */
export const spacingSemanticPx = {
  "page-x": 20, // 좌우 기본 패딩(좁은 화면 16)
  "page-x-narrow": 16,
  "section-gap": 32, // 섹션 간 간격
  "card-pad": 16,
  "safe-top": 44,
  "safe-bottom": 34,
} as const;

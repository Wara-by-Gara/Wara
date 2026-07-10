// 약관 전문 화면 공통 상수 — 웹(/terms/service·privacy·location) 미러.
// settings/terms 목록·상세 라우트가 함께 사용한다.

export const TERM_DETAIL_TYPES = ['service', 'privacy', 'location'] as const;

export type TermDetailType = (typeof TERM_DETAIL_TYPES)[number];

export const TERM_DETAIL_TITLE: Record<TermDetailType, string> = {
  service: '이용약관',
  privacy: '개인정보처리방침',
  location: '위치기반서비스 이용약관',
};

export function isTermDetailType(value: string | undefined): value is TermDetailType {
  return (TERM_DETAIL_TYPES as readonly string[]).includes(value ?? '');
}

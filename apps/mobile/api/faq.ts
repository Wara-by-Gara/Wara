// FAQ(자주 묻는 질문) API — 웹(apps/web/src/lib/api/faq.ts)에서 포팅.
// 백엔드는 활성 FAQ 평면 목록(GET /faq)만 제공한다(카테고리/검색 엔드포인트 없음).
// 검색은 클라이언트에서 question/answer 부분일치로 필터링한다.
// 인증 불필요 — authenticated: false.

import { apiFetch } from '@/api';

export type FaqItem = {
  id: string;
  question: string;
  answer: string;
  sortOrder: number;
  isActive: boolean;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
};

export function fetchActiveFaq(opts: { signal?: AbortSignal } = {}) {
  return apiFetch<FaqItem[]>('/faq', { authenticated: false, signal: opts.signal });
}

// ── Query keys ───────────────────────────────────────────────────────────────
export const faqKeys = {
  all: ['faq'] as const,
  list: () => ['faq', 'list'] as const,
};

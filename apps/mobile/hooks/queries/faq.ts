// FAQ TanStack Query 훅 — 활성 FAQ 평면 목록 조회. 검색은 화면에서 클라이언트 필터.

import { useQuery } from '@tanstack/react-query';

import { faqKeys, fetchActiveFaq } from '@/api/faq';

export function useFaq() {
  return useQuery({
    queryKey: faqKeys.list(),
    queryFn: ({ signal }) => fetchActiveFaq({ signal }),
  });
}

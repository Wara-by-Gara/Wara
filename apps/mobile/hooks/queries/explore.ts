// 공개 초대장 탐색 TanStack Query 훅 — 목록(무한 스크롤)·지도 마커.
// api/index.ts를 건드리지 않으므로 서브모듈에서 직접 import.

import { useInfiniteQuery, useQuery } from '@tanstack/react-query';

import {
  exploreKeys,
  getPublicInvitations,
  getPublicMapInvitations,
  type ExploreSort,
} from '@/api/explore';

const EXPLORE_PAGE_SIZE = 20;

export function usePublicInvitations(
  category: string | undefined,
  q: string,
  sort: ExploreSort,
) {
  const apiCategory = category || undefined;
  const apiQuery = q.trim() || undefined;

  return useInfiniteQuery({
    queryKey: exploreKeys.list(apiCategory, apiQuery, sort),
    queryFn: ({ pageParam, signal }) =>
      getPublicInvitations(
        {
          category: apiCategory,
          q: apiQuery,
          sort,
          limit: EXPLORE_PAGE_SIZE,
          cursor: pageParam,
        },
        { signal },
      ),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}

export function usePublicMapInvitations(
  bbox: { neLat: number; neLng: number; swLat: number; swLng: number } | null,
  category?: string,
) {
  return useQuery({
    queryKey: exploreKeys.map(
      bbox ?? { neLat: 0, neLng: 0, swLat: 0, swLng: 0 },
      category,
    ),
    queryFn: ({ signal }) =>
      getPublicMapInvitations(
        { ...bbox!, category: category || undefined },
        { signal },
      ),
    enabled: !!bbox,
  });
}

"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/constants/queryKeys";
import { getPublicInvitations, type ExploreSort } from "@/lib/api/invitations";
import type { EventCategory } from "@/lib/recommendedEvents";

const EXPLORE_PAGE_SIZE = 20;

export function usePublicInvitations(
  category: EventCategory = "all",
  q = "",
  sort: ExploreSort = "latest",
) {
  const apiCategory = category === "all" ? undefined : category;
  const apiQuery = q.trim() || undefined;

  return useInfiniteQuery({
    queryKey: QUERY_KEYS.invitations.explore(apiCategory, apiQuery, sort),
    queryFn: ({ pageParam }) =>
      getPublicInvitations({
        category: apiCategory,
        q: apiQuery,
        sort,
        limit: EXPLORE_PAGE_SIZE,
        cursor: pageParam as string | undefined,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}

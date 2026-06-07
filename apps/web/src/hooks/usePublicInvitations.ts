"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/constants/queryKeys";
import { getPublicInvitations } from "@/lib/api/invitations";
import type { EventCategory } from "@/lib/recommendedEvents";

const EXPLORE_PAGE_SIZE = 20;

export function usePublicInvitations(category: EventCategory = "all") {
  const apiCategory = category === "all" ? undefined : category;

  return useInfiniteQuery({
    queryKey: QUERY_KEYS.invitations.explore(apiCategory),
    queryFn: ({ pageParam }) =>
      getPublicInvitations({
        category: apiCategory,
        limit: EXPLORE_PAGE_SIZE,
        cursor: pageParam as string | undefined,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}

'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { fetchNotifications } from '../api';
import { notificationKeys } from '../query-keys';

export function useNotifications() {
  return useInfiniteQuery({
    queryKey: notificationKeys.lists(),
    queryFn: ({ pageParam }) =>
      fetchNotifications(pageParam as string | undefined),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}

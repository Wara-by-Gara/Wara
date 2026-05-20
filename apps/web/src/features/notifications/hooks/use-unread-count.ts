'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchUnreadCount } from '../api';
import { notificationKeys } from '../query-keys';

export function useUnreadCount() {
  return useQuery({
    queryKey: notificationKeys.unread(),
    queryFn: fetchUnreadCount,
    refetchInterval: 60_000,
  });
}

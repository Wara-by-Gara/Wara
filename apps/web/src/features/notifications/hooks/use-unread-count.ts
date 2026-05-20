'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchUnreadCount } from '../api';

export function useUnreadCount() {
  return useQuery({
    queryKey: ['notifications', 'unread'],
    queryFn: fetchUnreadCount,
    refetchInterval: 60_000,
  });
}

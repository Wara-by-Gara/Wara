'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchConversations } from '@/lib/api/conversations';
import { QUERY_KEYS } from '@/constants/queryKeys';

export function useConversations() {
  return useQuery({
    queryKey: QUERY_KEYS.conversations.list(),
    queryFn: fetchConversations,
  });
}

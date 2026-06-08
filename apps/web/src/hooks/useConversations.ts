'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchConversations, leaveConversation } from '@/lib/api/conversations';
import { QUERY_KEYS } from '@/constants/queryKeys';

export function useConversations() {
  return useQuery({
    queryKey: QUERY_KEYS.conversations.list(),
    queryFn: fetchConversations,
  });
}

export function useLeaveConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => leaveConversation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.conversations.list() });
    },
  });
}

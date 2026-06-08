'use client';

import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { io } from 'socket.io-client';
import { fetchConversations, leaveConversation } from '@/lib/api/conversations';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { SOCKET_BASE } from '@/lib/env';

export function useConversations() {
  return useQuery({
    queryKey: QUERY_KEYS.conversations.list(),
    queryFn: fetchConversations,
    // 목록 진입 시 항상 최신화 (다른 화면에서 받은 메시지 반영)
    refetchOnMount: "always",
  });
}

// 대화 목록 실시간 갱신 — 메시지 수신/삭제/읽음 시 목록 새로고침
export function useConversationsRealtime() {
  const qc = useQueryClient();
  useEffect(() => {
    const socket = io(`${SOCKET_BASE}/dm`, {
      withCredentials: true,
      transports: ['websocket'],
    });
    const refresh = () =>
      qc.invalidateQueries({ queryKey: QUERY_KEYS.conversations.list() });
    socket.on('message:new', refresh);
    socket.on('message:deleted', refresh);
    return () => {
      socket.disconnect();
    };
  }, [qc]);
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

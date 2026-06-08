'use client';

import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { io } from 'socket.io-client';
import {
  fetchConversations,
  fetchUnreadCount,
  leaveConversation,
} from '@/lib/api/conversations';
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

// 전체 안읽음 DM 수 (친구 탭 배지 / 채팅 세그먼트 개수)
export function useDmUnreadCount(enabled = true) {
  return useQuery({
    queryKey: QUERY_KEYS.conversations.unreadCount(),
    queryFn: fetchUnreadCount,
    enabled,
  });
}

// DM 전역 소켓 — 메시지 수신/삭제 시 목록 + 안읽음 카운트 갱신 (앱 전역 1회 마운트)
export function useDmGlobalSocket() {
  const qc = useQueryClient();
  useEffect(() => {
    const socket = io(`${SOCKET_BASE}/dm`, {
      withCredentials: true,
      transports: ['websocket'],
    });
    const refresh = () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.conversations.list() });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.conversations.unreadCount() });
    };
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

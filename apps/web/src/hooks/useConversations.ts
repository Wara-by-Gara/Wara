'use client';

import { useEffect } from 'react';
import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query';
import { io } from 'socket.io-client';
import {
  fetchConversations,
  fetchUnreadCount,
  leaveConversation,
  type ConversationListItem,
  type Message,
} from '@/lib/api/conversations';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { SOCKET_BASE } from '@/lib/env';

// 현재 열려있는 대화방 id. 전역 소켓이 "보고 있는 방"의 안읽음은 올리지 않도록 공유한다.
let activeConversationId: string | null = null;
export function setActiveConversation(id: string | null) {
  activeConversationId = id;
}

/**
 * 새 메시지를 대화 목록 캐시에 직접 반영 (refetch 없이) → rate limit 방지 + 즉시 반영.
 * 해당 방을 맨 위로 올리고 마지막 메시지/시각 갱신, 필요 시 안읽음 +1.
 * 캐시에 그 대화방이 없으면 false 반환 → 호출부에서 1회 invalidate 폴백.
 */
export function applyIncomingToList(
  qc: QueryClient,
  msg: Message,
  opts: { incrementUnread: boolean },
): boolean {
  let found = false;
  qc.setQueryData<ConversationListItem[]>(QUERY_KEYS.conversations.list(), (old) => {
    if (!old) return old;
    const idx = old.findIndex((c) => c.id === msg.conversationId);
    const prev = idx === -1 ? undefined : old[idx];
    if (!prev) return old;
    found = true;
    const updated: ConversationListItem = {
      ...prev,
      lastMessageText: msg.content,
      lastMessageAt: msg.createdAt,
      unreadCount: prev.unreadCount + (opts.incrementUnread ? 1 : 0),
    };
    return [updated, ...old.filter((_, i) => i !== idx)];
  });
  return found;
}

// 안읽음 카운트 갱신은 메시지마다 호출하지 않고 디바운스로 묶는다 (rate limit 방지).
let unreadTimer: ReturnType<typeof setTimeout> | null = null;
export function scheduleUnreadRefresh(qc: QueryClient) {
  if (unreadTimer) clearTimeout(unreadTimer);
  unreadTimer = setTimeout(() => {
    qc.invalidateQueries({ queryKey: QUERY_KEYS.conversations.unreadCount() });
  }, 1200);
}

export function useConversations() {
  return useQuery({
    queryKey: QUERY_KEYS.conversations.list(),
    queryFn: fetchConversations,
    // 목록 진입 시 항상 최신화 (다른 화면에서 받은 메시지 반영)
    refetchOnMount: 'always',
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

// DM 전역 소켓 — 메시지 수신/삭제 시 목록·안읽음 갱신 (앱 전역 1회 마운트)
export function useDmGlobalSocket() {
  const qc = useQueryClient();
  useEffect(() => {
    const socket = io(`${SOCKET_BASE}/dm`, {
      withCredentials: true,
      transports: ['websocket'],
    });
    socket.on('message:new', (msg: Message) => {
      const isActive = msg.conversationId === activeConversationId;
      // 목록 캐시 직접 갱신 (refetch 없음). 보고 있는 방이면 안읽음은 올리지 않는다.
      const ok = applyIncomingToList(qc, msg, { incrementUnread: !isActive });
      // 캐시에 없는(새로 생긴) 대화방 → 1회만 목록 invalidate
      if (!ok) qc.invalidateQueries({ queryKey: QUERY_KEYS.conversations.list() });
      if (!isActive) scheduleUnreadRefresh(qc);
    });
    socket.on('message:deleted', () => {
      // 삭제는 드물어 목록만 갱신 (마지막 메시지 미리보기 변동 가능)
      qc.invalidateQueries({ queryKey: QUERY_KEYS.conversations.list() });
      scheduleUnreadRefresh(qc);
    });
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

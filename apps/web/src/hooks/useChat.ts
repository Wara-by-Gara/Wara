'use client';

import { useEffect } from 'react';
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
  type QueryClient,
} from '@tanstack/react-query';
import { io } from 'socket.io-client';
import {
  fetchConversation,
  fetchMessages,
  sendMessage as apiSendMessage,
  editMessage as apiEditMessage,
  markConversationRead,
  deleteMessage as apiDeleteMessage,
  type ConversationDetail,
  type Message,
  type MessagesPage,
} from '@/lib/api/conversations';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { SOCKET_BASE } from '@/lib/env';

// 새 메시지를 캐시의 최신 페이지(page 0) 끝에 추가 (id 중복 방지)
function appendMessage(qc: QueryClient, id: string, msg: Message) {
  qc.setQueryData<InfiniteData<MessagesPage>>(
    QUERY_KEYS.conversations.messages(id),
    (old) => {
      if (!old || old.pages.length === 0) return old;
      const [first, ...rest] = old.pages;
      if (!first || first.messages.some((m) => m.id === msg.id)) return old;
      return {
        ...old,
        pages: [{ ...first, messages: [...first.messages, msg] }, ...rest],
      };
    },
  );
}

// 캐시에서 특정 메시지를 삭제 상태로 표시
function markDeleted(qc: QueryClient, id: string, messageId: string) {
  qc.setQueryData<InfiniteData<MessagesPage>>(
    QUERY_KEYS.conversations.messages(id),
    (old) =>
      old
        ? {
            ...old,
            pages: old.pages.map((p) => ({
              ...p,
              messages: p.messages.map((m) =>
                m.id === messageId ? { ...m, deleted: true, content: '' } : m,
              ),
            })),
          }
        : old,
  );
}

// 캐시에서 특정 메시지를 교체 (수정 반영)
function replaceMessage(qc: QueryClient, id: string, msg: Message) {
  qc.setQueryData<InfiniteData<MessagesPage>>(
    QUERY_KEYS.conversations.messages(id),
    (old) =>
      old
        ? {
            ...old,
            pages: old.pages.map((p) => ({
              ...p,
              messages: p.messages.map((m) => (m.id === msg.id ? msg : m)),
            })),
          }
        : old,
  );
}

export function useConversation(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.conversations.detail(id),
    queryFn: () => fetchConversation(id),
    enabled: Boolean(id),
  });
}

export function useChatMessages(id: string) {
  const query = useInfiniteQuery({
    queryKey: QUERY_KEYS.conversations.messages(id),
    queryFn: ({ pageParam }) => fetchMessages(id, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    enabled: Boolean(id),
    // 입장 시 항상 최신 메시지 로드 (다른 화면에 있는 동안 온 메시지 반영)
    refetchOnMount: "always",
  });

  // page 0 = 최신 블록, 이후 페이지일수록 과거 → 오래된→최신 순으로 펼침
  const messages =
    query.data?.pages.slice().reverse().flatMap((p) => p.messages) ?? [];

  return { ...query, messages };
}

export function useSendMessage(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ content, replyToMessageId }: { content: string; replyToMessageId?: string }) =>
      apiSendMessage(id, content, replyToMessageId),
    onSuccess: (msg) => {
      appendMessage(qc, id, msg);
      qc.invalidateQueries({ queryKey: QUERY_KEYS.conversations.list(), refetchType: 'all' });
    },
  });
}

export function useEditMessage(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ messageId, content }: { messageId: string; content: string }) =>
      apiEditMessage(id, messageId, content),
    onSuccess: (msg) => {
      replaceMessage(qc, id, msg);
      qc.invalidateQueries({ queryKey: QUERY_KEYS.conversations.list(), refetchType: 'all' });
    },
  });
}

export function useDeleteMessage(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (messageId: string) => apiDeleteMessage(id, messageId),
    onSuccess: (_data, messageId) => {
      markDeleted(qc, id, messageId);
      qc.invalidateQueries({ queryKey: QUERY_KEYS.conversations.list(), refetchType: 'all' });
    },
  });
}

// 대화방 입장 시 읽음 처리 + 실시간 수신
export function useChatRealtime(id: string) {
  const qc = useQueryClient();

  useEffect(() => {
    if (!id) return;

    markConversationRead(id)
      .then(() => {
        qc.invalidateQueries({ queryKey: QUERY_KEYS.conversations.list(), refetchType: 'all' });
        qc.invalidateQueries({ queryKey: QUERY_KEYS.conversations.unreadCount() });
      })
      .catch(() => {});

    const socket = io(`${SOCKET_BASE}/dm`, {
      withCredentials: true,
      transports: ['websocket'],
    });

    socket.on('message:new', (msg: Message) => {
      if (msg.conversationId !== id) {
        // 다른 대화방 메시지 → 목록 갱신만
        qc.invalidateQueries({ queryKey: QUERY_KEYS.conversations.list(), refetchType: 'all' });
        return;
      }
      appendMessage(qc, id, msg);
      // 읽음 처리 커밋 후 전역 안읽음 카운트도 갱신 — 안 하면 전역 소켓의 이른
      // refetch가 읽기 전 카운트(=1)를 잡아 하단 점·세그먼트 배지가 stale로 남는다.
      markConversationRead(id)
        .then(() => qc.invalidateQueries({ queryKey: QUERY_KEYS.conversations.unreadCount() }))
        .catch(() => {});
      qc.invalidateQueries({ queryKey: QUERY_KEYS.conversations.list(), refetchType: 'all' });
    });

    // 상대가 메시지 삭제 → 삭제 표시 동기화
    socket.on('message:deleted', (payload: { conversationId: string; messageId: string }) => {
      if (payload.conversationId !== id) return;
      markDeleted(qc, id, payload.messageId);
      qc.invalidateQueries({ queryKey: QUERY_KEYS.conversations.list(), refetchType: 'all' });
    });

    // 상대가 메시지 수정 → 교체
    socket.on('message:edited', (msg: Message) => {
      if (msg.conversationId !== id) return;
      replaceMessage(qc, id, msg);
      qc.invalidateQueries({ queryKey: QUERY_KEYS.conversations.list(), refetchType: 'all' });
    });

    // 상대가 읽음 → 내 메시지 읽음 표시 갱신
    socket.on('message:read', (payload: { conversationId: string; readerId: string }) => {
      if (payload.conversationId !== id) return;
      qc.setQueryData<ConversationDetail>(
        QUERY_KEYS.conversations.detail(id),
        (old) => (old ? { ...old, partnerLastReadAt: new Date().toISOString() } : old),
      );
    });

    return () => {
      socket.disconnect();
    };
  }, [id, qc]);
}

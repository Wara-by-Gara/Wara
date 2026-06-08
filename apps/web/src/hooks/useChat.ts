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
  markConversationRead,
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
  });

  // page 0 = 최신 블록, 이후 페이지일수록 과거 → 오래된→최신 순으로 펼침
  const messages =
    query.data?.pages.slice().reverse().flatMap((p) => p.messages) ?? [];

  return { ...query, messages };
}

export function useSendMessage(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (content: string) => apiSendMessage(id, content),
    onSuccess: (msg) => {
      appendMessage(qc, id, msg);
      qc.invalidateQueries({ queryKey: QUERY_KEYS.conversations.list() });
    },
  });
}

// 대화방 입장 시 읽음 처리 + 실시간 수신
export function useChatRealtime(id: string) {
  const qc = useQueryClient();

  useEffect(() => {
    if (!id) return;

    markConversationRead(id)
      .then(() => qc.invalidateQueries({ queryKey: QUERY_KEYS.conversations.list() }))
      .catch(() => {});

    const socket = io(`${SOCKET_BASE}/dm`, {
      withCredentials: true,
      transports: ['websocket'],
    });

    socket.on('message:new', (msg: Message) => {
      if (msg.conversationId !== id) {
        // 다른 대화방 메시지 → 목록 갱신만
        qc.invalidateQueries({ queryKey: QUERY_KEYS.conversations.list() });
        return;
      }
      appendMessage(qc, id, msg);
      markConversationRead(id).catch(() => {});
      qc.invalidateQueries({ queryKey: QUERY_KEYS.conversations.list() });
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

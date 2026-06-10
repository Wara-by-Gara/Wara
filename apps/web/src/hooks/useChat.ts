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
  toggleReaction as apiToggleReaction,
  getMessageReactors,
  getMessageImagePresignedUrl,
  uploadFileToPresignedUrl,
  sendImageMessage as apiSendImageMessage,
  type ConversationDetail,
  type Message,
  type MessagesPage,
  type ReactionEmoji,
  type ReactionSummary,
} from '@/lib/api/conversations';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { SOCKET_BASE } from '@/lib/env';
import {
  setActiveConversation,
  applyIncomingToList,
  scheduleUnreadRefresh,
} from '@/hooks/useConversations';

// 보고 있는 방의 읽음 처리를 메시지마다 호출하지 않고 디바운스로 묶는다 (rate limit 방지).
let readTimer: ReturnType<typeof setTimeout> | null = null;
function scheduleMarkRead(qc: QueryClient, id: string) {
  if (readTimer) clearTimeout(readTimer);
  readTimer = setTimeout(() => {
    markConversationRead(id)
      .then(() => scheduleUnreadRefresh(qc))
      .catch(() => {});
  }, 700);
}

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

// 메시지의 리액션 집계(+ 선택적으로 내 리액션)를 캐시에 반영
function applyReaction(
  qc: QueryClient,
  id: string,
  messageId: string,
  reactions: ReactionSummary[],
  myReaction?: string | null,
) {
  qc.setQueryData<InfiniteData<MessagesPage>>(
    QUERY_KEYS.conversations.messages(id),
    (old) =>
      old
        ? {
            ...old,
            pages: old.pages.map((p) => ({
              ...p,
              messages: p.messages.map((m) =>
                m.id === messageId
                  ? {
                      ...m,
                      reactions,
                      // myReaction 인자가 주어진 경우(내 토글)만 갱신, 상대 이벤트면 유지
                      myReaction: myReaction === undefined ? m.myReaction : myReaction,
                    }
                  : m,
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

  // page 0 = 최신 블록, 이후 페이지일수록 과거 -> 오래된->최신 순으로 펼침
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
      // 목록 캐시 직접 갱신 (내 메시지 -> 안읽음 안 올림). 캐시에 없으면 1회 폴백.
      if (!applyIncomingToList(qc, msg, { incrementUnread: false })) {
        qc.invalidateQueries({ queryKey: QUERY_KEYS.conversations.list() });
      }
    },
  });
}

// 이미지 메시지 전송: presigned URL 발급 -> S3 업로드 -> 메시지 전송
export function useSendImageMessage(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      const subtype = file.type.split('/')[1] ?? 'jpg';
      const fileName = `${Date.now()}.${subtype === 'jpeg' ? 'jpg' : subtype}`;
      const { presignedUrl, key } = await getMessageImagePresignedUrl(id, fileName, file.type);
      await uploadFileToPresignedUrl(presignedUrl, file);
      return apiSendImageMessage(id, key);
    },
    onSuccess: (msg) => {
      appendMessage(qc, id, msg);
      if (!applyIncomingToList(qc, msg, { incrementUnread: false })) {
        qc.invalidateQueries({ queryKey: QUERY_KEYS.conversations.list() });
      }
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

// 리액션 상세(누가 어떤 이모지) - 바텀시트 열릴 때만 조회
export function useMessageReactors(id: string, messageId: string | null) {
  return useQuery({
    queryKey: QUERY_KEYS.conversations.reactors(id, messageId ?? ""),
    queryFn: () => getMessageReactors(id, messageId!),
    enabled: Boolean(id && messageId),
  });
}

export function useToggleReaction(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ messageId, emoji }: { messageId: string; emoji: ReactionEmoji }) =>
      apiToggleReaction(id, messageId, emoji),
    onSuccess: (res) => {
      // 서버가 집계 + 내 리액션을 권위있게 반환 -> 그대로 반영
      applyReaction(qc, id, res.messageId, res.reactions, res.myReaction);
    },
  });
}

// 대화방 입장 시 읽음 처리 + 실시간 수신
export function useChatRealtime(id: string) {
  const qc = useQueryClient();

  useEffect(() => {
    if (!id) return;

    // 보고 있는 방을 전역 소켓에 알려, 전역 소켓이 이 방의 안읽음을 올리지 않게 한다.
    setActiveConversation(id);

    // 입장 시 1회: 읽음 처리 + 목록/안읽음 최신화 (이 방 안읽음 0으로 수렴)
    markConversationRead(id)
      .then(() => {
        qc.invalidateQueries({ queryKey: QUERY_KEYS.conversations.list() });
        qc.invalidateQueries({ queryKey: QUERY_KEYS.conversations.unreadCount() });
      })
      .catch(() => {});

    const socket = io(`${SOCKET_BASE}/dm`, {
      withCredentials: true,
      transports: ['websocket'],
    });

    socket.on('message:new', (msg: Message) => {
      // 다른 방/목록 갱신은 전역 소켓(useDmGlobalSocket)이 담당 -> 여기선 이 방만 처리.
      if (msg.conversationId !== id) return;
      appendMessage(qc, id, msg);
      // 읽음 처리는 디바운스 (메시지마다 POST /read 호출 방지 -> rate limit 방지)
      scheduleMarkRead(qc, id);
    });

    // 상대가 메시지 삭제 -> 열린 방의 메시지 캐시만 동기화 (목록은 전역 소켓이 갱신)
    socket.on('message:deleted', (payload: { conversationId: string; messageId: string }) => {
      if (payload.conversationId !== id) return;
      markDeleted(qc, id, payload.messageId);
    });

    // 상대가 메시지 수정 -> 교체
    socket.on('message:edited', (msg: Message) => {
      if (msg.conversationId !== id) return;
      replaceMessage(qc, id, msg);
    });

    // 상대가 리액션 변경 -> 집계만 갱신 (내 myReaction은 유지)
    socket.on(
      'message:reaction',
      (payload: { conversationId: string; messageId: string; reactions: ReactionSummary[] }) => {
        if (payload.conversationId !== id) return;
        applyReaction(qc, id, payload.messageId, payload.reactions);
      },
    );

    // 상대가 읽음 -> 내 메시지 읽음 표시 갱신
    socket.on('message:read', (payload: { conversationId: string; readerId: string }) => {
      if (payload.conversationId !== id) return;
      qc.setQueryData<ConversationDetail>(
        QUERY_KEYS.conversations.detail(id),
        (old) => (old ? { ...old, partnerLastReadAt: new Date().toISOString() } : old),
      );
    });

    // 재연결: 끊긴 동안 놓친 메시지는 replay되지 않으므로 강제 재동기화한다.
    // (staleTime 때문에 refetchOnReconnect만으론 복구 안 되는 케이스 보완)
    const onReconnect = () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.conversations.messages(id) });
      scheduleMarkRead(qc, id);
    };
    socket.io.on('reconnect', onReconnect);

    return () => {
      socket.io.off('reconnect', onReconnect);
      // 예약된 읽음 처리 타이머 정리 - 방 전환/언마운트 후 엉뚱한 방의 markRead 발화 방지
      if (readTimer) {
        clearTimeout(readTimer);
        readTimer = null;
      }
      setActiveConversation(null);
      socket.disconnect();
    };
  }, [id, qc]);
}

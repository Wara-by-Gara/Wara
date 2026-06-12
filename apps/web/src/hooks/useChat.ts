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
  getConversationParticipants,
  getConversationPhotos,
  inviteToConversation,
  setConversationAlias,
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

// 상대 읽음 이벤트로 안읽음 카운트를 재조회 — 쓰로틀(리셋 안 함)로 지연 상한 고정.
// (그룹에서 여러 명의 read 이벤트가 몰려도 디바운스처럼 계속 밀리지 않게)
let refreshTimer: ReturnType<typeof setTimeout> | null = null;
function scheduleMessagesRefresh(qc: QueryClient, id: string) {
  if (refreshTimer) return;
  refreshTimer = setTimeout(() => {
    refreshTimer = null;
    qc.invalidateQueries({ queryKey: QUERY_KEYS.conversations.messages(id) });
  }, 250);
}

// 보고 있는 방의 읽음 처리 — 쓰로틀로 묶는다 (rate limit 방지 + 읽음 등록 지연 상한 고정).
let readTimer: ReturnType<typeof setTimeout> | null = null;
function scheduleMarkRead(qc: QueryClient, id: string) {
  if (readTimer) return;
  readTimer = setTimeout(() => {
    readTimer = null;
    markConversationRead(id)
      .then(() => {
        scheduleUnreadRefresh(qc);
        // 내가 읽으면 내 화면의 (남이 보낸) 메시지 안읽음 수에서 나를 빼야 하므로
        // 메시지도 재조회 (message:read는 남에게만 가서 내 화면은 갱신 안 됨)
        qc.invalidateQueries({ queryKey: QUERY_KEYS.conversations.messages(id) });
      })
      .catch(() => {});
  }, 500);
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
  // 리액션 상세 시트(누가 눌렀는지) 캐시 무효화 -> 열려있으면 즉시 갱신, 닫혀있으면 재오픈 시 최신
  qc.invalidateQueries({ queryKey: QUERY_KEYS.conversations.reactors(id, messageId) });
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
      // 서랍 사진 갤러리 즉시 갱신
      qc.invalidateQueries({ queryKey: QUERY_KEYS.conversations.photos(id) });
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

// 대화방 서랍(참여자/사진) - 서랍 열릴 때만 조회
export function useConversationParticipants(id: string, enabled: boolean) {
  return useQuery({
    queryKey: QUERY_KEYS.conversations.participants(id),
    queryFn: () => getConversationParticipants(id),
    enabled: Boolean(id) && enabled,
  });
}

export function useConversationPhotos(id: string, enabled: boolean) {
  return useQuery({
    queryKey: QUERY_KEYS.conversations.photos(id),
    queryFn: () => getConversationPhotos(id),
    enabled: Boolean(id) && enabled,
  });
}

// 초대 (direct -> 새 그룹 / group -> 멤버 추가). 목록/참여자 캐시 갱신.
export function useInvite(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userIds, title }: { userIds: string[]; title?: string }) =>
      inviteToConversation(id, userIds, title),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.conversations.list() });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.conversations.participants(id) });
      // group에 멤버 추가 시 초대자 화면에도 입장 안내가 보이도록
      qc.invalidateQueries({ queryKey: QUERY_KEYS.conversations.messages(id) });
    },
  });
}

// 내 개인 방 별명 설정 -> 상세/목록 갱신
export function useSetAlias(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (alias: string) => setConversationAlias(id, alias),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.conversations.detail(id) });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.conversations.list() });
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
      // 시스템 메시지(입장/퇴장) -> 멤버수/목록 갱신
      if (msg.type === 'system') {
        qc.invalidateQueries({ queryKey: QUERY_KEYS.conversations.detail(id) });
        qc.invalidateQueries({ queryKey: QUERY_KEYS.conversations.participants(id) });
      }
      // 사진 수신 -> 서랍 갤러리 갱신
      if (msg.imageUrl) {
        qc.invalidateQueries({ queryKey: QUERY_KEYS.conversations.photos(id) });
      }
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
      // 메시지별 안읽음 수 갱신 (그룹: 한 명 읽으면 숫자 감소)
      scheduleMessagesRefresh(qc, id);
    });

    // 연결(최초+재연결)될 때마다 메시지 재동기화한다.
    // 소켓이 user 룸에 join하기 직전(또는 끊긴 동안)에 도착한 메시지는 replay되지
    // 않으므로, connect 시점에 한 번 더 당겨와 그 갭을 메운다.
    const onConnect = () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.conversations.messages(id) });
      scheduleMarkRead(qc, id);
    };
    socket.on('connect', onConnect);

    return () => {
      socket.off('connect', onConnect);
      // 예약된 읽음 처리 타이머 정리 - 방 전환/언마운트 후 엉뚱한 방의 markRead 발화 방지
      if (readTimer) {
        clearTimeout(readTimer);
        readTimer = null;
      }
      if (refreshTimer) {
        clearTimeout(refreshTimer);
        refreshTimer = null;
      }
      setActiveConversation(null);
      socket.disconnect();
    };
  }, [id, qc]);
}

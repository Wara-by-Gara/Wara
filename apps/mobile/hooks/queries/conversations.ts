// DM 대화/메시지 TanStack Query 훅.
// - 대화 목록: useQuery
// - 메시지: useInfiniteQuery (커서 = MessagesPage.nextCursor, 더 과거로 페이징)
// - 전송: useMutation (낙관적 append → 성공 시 서버 메시지로 교체, 실패 시 롤백)

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query';

import {
  conversationKeys,
  createConversation,
  fetchConversation,
  fetchConversations,
  fetchMessages,
  fetchUnreadCount,
  markConversationRead,
  sendMessage,
  type Message,
  type MessagesPage,
} from '@/api/conversations';

// ── 조회 ────────────────────────────────────────────────────────────────────

export function useConversations() {
  return useQuery({
    queryKey: conversationKeys.list(),
    queryFn: ({ signal }) => fetchConversations({ signal }),
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: conversationKeys.unreadCount(),
    queryFn: ({ signal }) => fetchUnreadCount({ signal }),
  });
}

export function useConversation(conversationId: string) {
  return useQuery({
    queryKey: conversationKeys.detail(conversationId),
    queryFn: ({ signal }) => fetchConversation(conversationId, { signal }),
    enabled: !!conversationId,
  });
}

export function useMessages(conversationId: string) {
  return useInfiniteQuery({
    queryKey: conversationKeys.messages(conversationId),
    queryFn: ({ pageParam, signal }) =>
      fetchMessages(conversationId, pageParam, { signal }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage: MessagesPage) => lastPage.nextCursor ?? undefined,
    enabled: !!conversationId,
  });
}

// ── 캐시 헬퍼 ──────────────────────────────────────────────────────────────────

/** 최신 페이지(pages[0]) 끝에 메시지를 붙인다(= 화면 하단 = 최신). */
function appendMessage(
  old: InfiniteData<MessagesPage> | undefined,
  message: Message,
): InfiniteData<MessagesPage> {
  if (!old || old.pages.length === 0) {
    return { pages: [{ messages: [message], nextCursor: null }], pageParams: [undefined] };
  }
  const [first, ...rest] = old.pages;
  if (!first) return old;
  return {
    ...old,
    pages: [{ ...first, messages: [...first.messages, message] }, ...rest],
  };
}

function replaceMessage(
  old: InfiniteData<MessagesPage> | undefined,
  tempId: string,
  real: Message,
): InfiniteData<MessagesPage> | undefined {
  if (!old) return old;
  return {
    ...old,
    pages: old.pages.map((page) => ({
      ...page,
      messages: page.messages.map((m) => (m.id === tempId ? real : m)),
    })),
  };
}

// ── 전송 ────────────────────────────────────────────────────────────────────

type SendVars = { content: string; replyToMessageId?: string };

export function useSendMessage(conversationId: string, meId: string) {
  const qc = useQueryClient();
  const key = conversationKeys.messages(conversationId);

  return useMutation({
    mutationFn: ({ content, replyToMessageId }: SendVars) =>
      sendMessage(conversationId, content, replyToMessageId),
    onMutate: async ({ content }) => {
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<InfiniteData<MessagesPage>>(key);
      const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const optimistic: Message = {
        id: tempId,
        conversationId,
        senderId: meId,
        type: 'user',
        content,
        createdAt: new Date().toISOString(),
        deleted: false,
        edited: false,
        replyTo: null,
        reactions: [],
        myReaction: null,
        imageUrl: null,
        unreadCount: 0,
      };
      qc.setQueryData<InfiniteData<MessagesPage>>(key, (old) => appendMessage(old, optimistic));
      return { prev, tempId };
    },
    onSuccess: (real, _vars, ctx) => {
      qc.setQueryData<InfiniteData<MessagesPage>>(key, (old) =>
        replaceMessage(old, ctx.tempId, real),
      );
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(key, ctx.prev);
    },
    onSettled: () => {
      // 대화 목록의 마지막 메시지/미읽음 최신화
      void qc.invalidateQueries({ queryKey: conversationKeys.list() });
    },
  });
}

// ── 대화 시작(1:1) ──────────────────────────────────────────────────────────────

export function useCreateConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (targetUserId: string) => createConversation(targetUserId),
    onSuccess: () => qc.invalidateQueries({ queryKey: conversationKeys.list() }),
  });
}

// ── 읽음 처리 ──────────────────────────────────────────────────────────────────

export function useMarkRead(conversationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => markConversationRead(conversationId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: conversationKeys.list() });
      void qc.invalidateQueries({ queryKey: conversationKeys.unreadCount() });
    },
  });
}

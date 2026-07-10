// 목적: '/dm' 네임스페이스를 구독해 실시간 DM 이벤트를 TanStack Query 캐시에 반영하는 훅.
//
// 서버 이벤트명은 apps/api/src/conversations/conversations.gateway.ts에서 확인:
//   - 'message:new'      ChatMessagePayload            (상대에게 새 메시지 푸시 — 내가 보낸 건 안 옴)
//   - 'message:read'     { conversationId, readerId }  (상대가 읽음)
//   - 'message:deleted'  { conversationId, messageId }
//   - 'message:edited'   ChatMessagePayload
//   - 'message:reaction' { conversationId, messageId, reactions }
// (typing 이벤트는 서버에 없어 처리하지 않는다.)

import { useQueryClient, type InfiniteData } from '@tanstack/react-query';

import { conversationKeys, type ConversationDetail, type Message, type MessagesPage, type ReactionSummary } from '@/api/conversations';
import { useNamespaceSocket, type NamespaceSocket } from './useNamespaceSocket';

type Options = {
  enabled?: boolean;
  /** 현재 열린 대화방 id — 이 방으로 새 메시지가 오면 onMessageNew를 호출한다. */
  activeConversationId?: string;
  /** 활성 대화방에 새 메시지 도착 시 콜백(자동 읽음 처리·스크롤 등). */
  onMessageNew?: (message: Message) => void;
};

function asRecord(payload: unknown): Record<string, unknown> {
  return payload !== null && typeof payload === 'object'
    ? (payload as Record<string, unknown>)
    : {};
}

function str(v: unknown): string | null {
  return typeof v === 'string' && v.length > 0 ? v : null;
}

/** ChatMessagePayload(소켓) → Message. 소켓 페이로드엔 reactions/imageUrl 등이 없어 기본값으로 채운다. */
function toMessage(p: Record<string, unknown>): Message | null {
  const id = str(p.id);
  const conversationId = str(p.conversationId);
  const senderId = str(p.senderId);
  if (!id || !conversationId || !senderId) return null;

  const reply = asRecord(p.replyTo);
  const replyId = str(reply.id);
  const replySender = str(reply.senderId);

  return {
    id,
    conversationId,
    senderId,
    type: 'user',
    content: str(p.content) ?? '',
    createdAt: str(p.createdAt) ?? new Date().toISOString(),
    deleted: p.deleted === true,
    edited: p.edited === true,
    replyTo:
      replyId && replySender
        ? {
            id: replyId,
            senderId: replySender,
            content: str(reply.content) ?? '',
            deleted: reply.deleted === true,
          }
        : null,
    reactions: [],
    myReaction: null,
    imageUrl: null,
    unreadCount: 0,
  };
}

function appendMessage(
  old: InfiniteData<MessagesPage> | undefined,
  message: Message,
): InfiniteData<MessagesPage> {
  if (!old || old.pages.length === 0) {
    return { pages: [{ messages: [message], nextCursor: null }], pageParams: [undefined] };
  }
  // 이미 존재하면(중복 수신) 그대로 둔다.
  if (old.pages.some((page) => page.messages.some((m) => m.id === message.id))) return old;
  const [first, ...rest] = old.pages;
  if (!first) return old;
  return {
    ...old,
    pages: [{ ...first, messages: [...first.messages, message] }, ...rest],
  };
}

function patchMessage(
  old: InfiniteData<MessagesPage> | undefined,
  messageId: string,
  patch: Partial<Message>,
): InfiniteData<MessagesPage> | undefined {
  if (!old) return old;
  return {
    ...old,
    pages: old.pages.map((page) => ({
      ...page,
      messages: page.messages.map((m) => (m.id === messageId ? { ...m, ...patch } : m)),
    })),
  };
}

export function useDmSocket(opts: Options = {}): NamespaceSocket {
  const { enabled = true, activeConversationId, onMessageNew } = opts;
  const qc = useQueryClient();

  return useNamespaceSocket('/dm', {
    enabled,
    handlers: {
      'message:new': (payload) => {
        const message = toMessage(asRecord(payload));
        if (!message) return;
        qc.setQueryData<InfiniteData<MessagesPage>>(
          conversationKeys.messages(message.conversationId),
          (old) => appendMessage(old, message),
        );
        void qc.invalidateQueries({ queryKey: conversationKeys.list() });
        if (message.conversationId === activeConversationId) onMessageNew?.(message);
      },
      'message:read': (payload) => {
        const data = asRecord(payload);
        const conversationId = str(data.conversationId);
        if (!conversationId) return;
        // 1:1 읽음 표시 — 상대가 방금 읽었으므로 partnerLastReadAt을 현재로 올린다.
        qc.setQueryData<ConversationDetail>(conversationKeys.detail(conversationId), (old) =>
          old ? { ...old, partnerLastReadAt: new Date().toISOString() } : old,
        );
      },
      'message:deleted': (payload) => {
        const data = asRecord(payload);
        const conversationId = str(data.conversationId);
        const messageId = str(data.messageId);
        if (!conversationId || !messageId) return;
        qc.setQueryData<InfiniteData<MessagesPage>>(
          conversationKeys.messages(conversationId),
          (old) => patchMessage(old, messageId, { deleted: true, content: '' }),
        );
      },
      'message:edited': (payload) => {
        const message = toMessage(asRecord(payload));
        if (!message) return;
        qc.setQueryData<InfiniteData<MessagesPage>>(
          conversationKeys.messages(message.conversationId),
          (old) => patchMessage(old, message.id, { content: message.content, edited: true }),
        );
      },
      'message:reaction': (payload) => {
        const data = asRecord(payload);
        const conversationId = str(data.conversationId);
        const messageId = str(data.messageId);
        if (!conversationId || !messageId) return;
        const reactions = Array.isArray(data.reactions)
          ? (data.reactions as ReactionSummary[])
          : [];
        qc.setQueryData<InfiniteData<MessagesPage>>(
          conversationKeys.messages(conversationId),
          (old) => patchMessage(old, messageId, { reactions }),
        );
      },
    },
  });
}

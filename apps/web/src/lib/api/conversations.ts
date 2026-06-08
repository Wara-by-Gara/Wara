import { apiGet, apiPost } from './client';

export type ConversationPartner = {
  id: string;
  name: string | null;
  avatarUrl: string | null;
};

export type ConversationListItem = {
  id: string;
  partner: ConversationPartner;
  lastMessageText: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
};

export type ConversationDetail = {
  id: string;
  partner: ConversationPartner | null;
  /** 상대가 마지막으로 읽은 시각 (내 메시지 읽음 표시용) */
  partnerLastReadAt: string | null;
};

export type Message = {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: string;
};

export type MessagesPage = {
  messages: Message[];
  nextCursor: string | null;
};

export function fetchConversations() {
  return apiGet<ConversationListItem[]>('/conversations');
}

export function createConversation(targetUserId: string) {
  return apiPost<{ id: string }>('/conversations', { targetUserId });
}

export function fetchConversation(id: string) {
  return apiGet<ConversationDetail>(`/conversations/${id}`);
}

export function fetchMessages(id: string, cursor?: string) {
  const qs = cursor ? `?cursor=${encodeURIComponent(cursor)}` : '';
  return apiGet<MessagesPage>(`/conversations/${id}/messages${qs}`);
}

export function sendMessage(id: string, content: string) {
  return apiPost<Message>(`/conversations/${id}/messages`, { content });
}

export function markConversationRead(id: string) {
  return apiPost<void>(`/conversations/${id}/read`);
}

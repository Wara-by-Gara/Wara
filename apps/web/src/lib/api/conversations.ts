import { apiGet } from './client';

export type ConversationListItem = {
  id: string;
  partner: { id: string; name: string | null; avatarUrl: string | null };
  lastMessageText: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
};

export function fetchConversations() {
  return apiGet<ConversationListItem[]>('/conversations');
}

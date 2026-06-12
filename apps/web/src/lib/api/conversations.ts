import { apiGet, apiPost, apiPatch, apiDelete } from './client';

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

export type ReplyPreview = {
  id: string;
  senderId: string;
  content: string;
  deleted: boolean;
};

// 이모지 리액션 키 (백엔드 react-message.dto REACTION_EMOJIS와 일치)
export const REACTION_EMOJIS = [
  "heart",
  "thumbsup",
  "check",
  "smile",
  "surprise",
  "cry",
] as const;
export type ReactionEmoji = (typeof REACTION_EMOJIS)[number];

// 키 -> 실제 이모지 문자
export const REACTION_EMOJI_CHAR: Record<ReactionEmoji, string> = {
  heart: "❤️",
  thumbsup: "👍",
  check: "✅",
  smile: "😄",
  surprise: "😮",
  cry: "😢",
};

export type ReactionSummary = {
  emoji: string;
  count: number;
};

export type Message = {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: string;
  deleted: boolean;
  edited: boolean;
  replyTo: ReplyPreview | null;
  reactions: ReactionSummary[];
  myReaction: string | null;
  // 이미지 메시지의 조회용 URL (텍스트 메시지는 null)
  imageUrl: string | null;
};

// 메시지 이미지 업로드 허용 타입 (백엔드 enum과 일치)
export const MESSAGE_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
] as const;

export function getMessageImagePresignedUrl(
  conversationId: string,
  fileName: string,
  contentType: string,
) {
  return apiPost<{ presignedUrl: string; key: string }>(
    `/conversations/${conversationId}/messages/presigned-url`,
    { fileName, contentType },
  );
}

export async function uploadFileToPresignedUrl(presignedUrl: string, file: File): Promise<void> {
  const res = await fetch(presignedUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });
  if (!res.ok) throw new Error("IMAGE_UPLOAD_FAILED");
}

export function sendImageMessage(conversationId: string, imageKey: string) {
  return apiPost<Message>(`/conversations/${conversationId}/messages`, { imageKey });
}

export type ToggleReactionResult = {
  messageId: string;
  reactions: ReactionSummary[];
  myReaction: string | null;
};

export function toggleReaction(
  conversationId: string,
  messageId: string,
  emoji: ReactionEmoji,
) {
  return apiPost<ToggleReactionResult>(
    `/conversations/${conversationId}/messages/${messageId}/reactions`,
    { emoji },
  );
}

// 리액션 상세: 누가 어떤 이모지를 눌렀는지
export type MessageReactor = {
  userId: string;
  name: string | null;
  avatarUrl: string | null;
  emoji: string;
};

export function getMessageReactors(conversationId: string, messageId: string) {
  return apiGet<{ reactors: MessageReactor[] }>(
    `/conversations/${conversationId}/messages/${messageId}/reactions`,
  );
}

export type MessagesPage = {
  messages: Message[];
  nextCursor: string | null;
};

export function fetchConversations() {
  return apiGet<ConversationListItem[]>('/conversations');
}

export function fetchUnreadCount() {
  return apiGet<{ count: number }>('/conversations/unread-count');
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

export function sendMessage(id: string, content: string, replyToMessageId?: string) {
  return apiPost<Message>(`/conversations/${id}/messages`, {
    content,
    replyToMessageId,
  });
}

export function editMessage(id: string, messageId: string, content: string) {
  return apiPatch<Message>(`/conversations/${id}/messages/${messageId}`, { content });
}

export function markConversationRead(id: string) {
  return apiPost<void>(`/conversations/${id}/read`);
}

/** 채팅방 나가기 (나만 — 상대 기록 유지) */
export function leaveConversation(id: string) {
  return apiDelete(`/conversations/${id}`);
}

/** 내 메시지 삭제 (모두에게서 — soft delete) */
export function deleteMessage(conversationId: string, messageId: string) {
  return apiDelete(`/conversations/${conversationId}/messages/${messageId}`);
}

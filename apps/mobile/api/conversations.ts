// DM/채팅 API — 웹(apps/web/src/lib/api/conversations.ts) 포팅.
// 이미지 첨부는 범위 밖이라 presigned/업로드/이미지 전송 함수는 제외했다(텍스트 전용).
// 리액션 토글 UI도 이 단계 범위 밖이지만, 소켓 reaction 이벤트 타입 정합을 위해
// ReactionSummary/Message.reactions 필드는 서버 응답 그대로 유지한다.

import { apiFetch, newIdempotencyKey } from '@/api';

export type ConversationPartner = {
  id: string;
  name: string | null;
  avatarUrl: string | null;
};

export type ConversationListItem = {
  id: string;
  type: 'direct' | 'group';
  /** 표시용 이름 (direct=상대, group=그룹명/자동) */
  title: string;
  /** 표시용 이미지 (group은 null=기본 아이콘) */
  avatarUrl: string | null;
  /** 1:1 상대 정보 — title이 비어도 이름/아바타 폴백용 (group=null) */
  partner: ConversationPartner | null;
  memberCount: number;
  lastMessageText: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
};

export type ConversationDetail = {
  id: string;
  type: 'direct' | 'group';
  /** 표시용 이름 (direct=상대 이름, group=그룹명) */
  title: string;
  memberCount: number;
  /** direct만 — 상대 정보 (group은 null) */
  partner: ConversationPartner | null;
  /** 상대가 마지막으로 읽은 시각 (내 메시지 읽음 표시용, group은 null) */
  partnerLastReadAt: string | null;
};

export type ReplyPreview = {
  id: string;
  senderId: string;
  content: string;
  deleted: boolean;
};

export type ReactionSummary = {
  emoji: string;
  count: number;
};

export type Message = {
  id: string;
  conversationId: string;
  senderId: string;
  /** 'user' | 'system' (입장/퇴장 안내) */
  type: string;
  content: string;
  createdAt: string;
  deleted: boolean;
  edited: boolean;
  replyTo: ReplyPreview | null;
  reactions: ReactionSummary[];
  myReaction: string | null;
  /** 이미지 메시지의 조회용 URL (텍스트 메시지는 null) */
  imageUrl: string | null;
  /** 아직 안 읽은 다른 참여자 수 (보낸 사람 제외). 카톡식 숫자. */
  unreadCount: number;
};

export type MessagesPage = {
  messages: Message[];
  nextCursor: string | null;
};

export type ConversationParticipant = {
  userId: string;
  name: string | null;
  avatarUrl: string | null;
};

// ── Query keys ────────────────────────────────────────────────────────────────
export const conversationKeys = {
  all: ['conversations'] as const,
  list: () => [...conversationKeys.all, 'list'] as const,
  unreadCount: () => [...conversationKeys.all, 'unread-count'] as const,
  detail: (id: string) => [...conversationKeys.all, 'detail', id] as const,
  messages: (id: string) => [...conversationKeys.all, 'messages', id] as const,
};

// ── 조회 ────────────────────────────────────────────────────────────────────

export function fetchConversations(opts: { signal?: AbortSignal } = {}) {
  return apiFetch<ConversationListItem[]>('/conversations', { signal: opts.signal });
}

export function fetchUnreadCount(opts: { signal?: AbortSignal } = {}) {
  return apiFetch<{ count: number }>('/conversations/unread-count', { signal: opts.signal });
}

export function fetchConversation(id: string, opts: { signal?: AbortSignal } = {}) {
  return apiFetch<ConversationDetail>(`/conversations/${id}`, { signal: opts.signal });
}

// 커서 페이지네이션 — nextCursor는 응답 body(MessagesPage)에 담겨 오므로 apiFetch로 충분.
// (apiFetchWithMeta의 meta엔 커서가 없어 여기선 사용하지 않는다.)
export function fetchMessages(
  id: string,
  cursor?: string,
  opts: { signal?: AbortSignal } = {},
) {
  const qs = cursor ? `?cursor=${encodeURIComponent(cursor)}` : '';
  return apiFetch<MessagesPage>(`/conversations/${id}/messages${qs}`, { signal: opts.signal });
}

export function getConversationParticipants(id: string, opts: { signal?: AbortSignal } = {}) {
  return apiFetch<{ participants: ConversationParticipant[] }>(
    `/conversations/${id}/participants`,
    { signal: opts.signal },
  );
}

// ── 변경 ────────────────────────────────────────────────────────────────────

export function createConversation(targetUserId: string) {
  return apiFetch<{ id: string }>('/conversations', {
    method: 'POST',
    body: { targetUserId },
    idempotencyKey: newIdempotencyKey(),
  });
}

export function sendMessage(id: string, content: string, replyToMessageId?: string) {
  return apiFetch<Message>(`/conversations/${id}/messages`, {
    method: 'POST',
    body: { content, replyToMessageId },
    idempotencyKey: newIdempotencyKey(),
  });
}

export function markConversationRead(id: string) {
  return apiFetch<void>(`/conversations/${id}/read`, { method: 'POST' });
}

/** 채팅방 나가기 (나만 — 상대 기록 유지) */
export function leaveConversation(id: string) {
  return apiFetch<void>(`/conversations/${id}`, { method: 'DELETE' });
}

/** 내 메시지 삭제 (모두에게서 — soft delete) */
export function deleteMessage(conversationId: string, messageId: string) {
  return apiFetch<void>(`/conversations/${conversationId}/messages/${messageId}`, {
    method: 'DELETE',
  });
}

// ── 그룹 관리 ─────────────────────────────────────────────────────────────────

// 초대 (direct -> 새 그룹 / group -> 멤버 추가). 이동할 conversationId 반환.
// title은 새 그룹 최초 생성 시 공유 방 이름(선택).
export function inviteToConversation(id: string, userIds: string[], title?: string) {
  return apiFetch<{ conversationId: string }>(`/conversations/${id}/invite`, {
    method: 'POST',
    body: { userIds, ...(title ? { title } : {}) },
    idempotencyKey: newIdempotencyKey(),
  });
}

// 내 개인 방 별명 설정/해제 (빈 문자열이면 기본 이름으로)
export function setConversationAlias(id: string, alias: string) {
  return apiFetch<{ conversationId: string }>(`/conversations/${id}/alias`, {
    method: 'PATCH',
    body: { alias },
  });
}

// ── 이미지 메시지 (presigned URL → S3 PUT → 전송) ────────────────────────────────
// 웹 apps/web/src/lib/api/conversations.ts 포팅. 실제 S3 PUT은 hooks/useImageUpload에서 수행.
// imageKey는 서버에서 dm/{conversationId}/ prefix 및 S3 객체 존재를 검증(MESSAGE_IMAGE_INVALID).

/** 메시지 이미지 업로드 허용 타입 (서버 enum과 일치). */
export const MESSAGE_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
] as const;

/** POST /conversations/:id/messages/presigned-url — 대화방 이미지 presigned URL 발급. */
export function getMessageImagePresignedUrl(
  conversationId: string,
  fileName: string,
  contentType: string,
) {
  return apiFetch<{ presignedUrl: string; key: string }>(
    `/conversations/${conversationId}/messages/presigned-url`,
    { method: 'POST', body: { fileName, contentType } },
  );
}

/** POST /conversations/:id/messages — 이미지 메시지 전송(imageKey만, content 없음). */
export function sendImageMessage(conversationId: string, imageKey: string) {
  return apiFetch<Message>(`/conversations/${conversationId}/messages`, {
    method: 'POST',
    body: { imageKey },
    idempotencyKey: newIdempotencyKey(),
  });
}

// 목적: in-app 알림 API 클라이언트 — 웹(apps/web/src/lib/api/notifications.ts)에서 포팅.
// 이 Phase 범위: 목록(커서 페이지네이션) · 미읽음 수 · 개별 읽음 · 전체 읽음.
// (설정/삭제는 후속 Phase.)
import { apiFetch } from '@/api';

export type NotificationType =
  | 'remind'
  | 'participantLocations'
  | 'eventLocations'
  | 'feedback'
  | 'invitation_date'
  | 'photo'
  | 'arrived'
  | 'nudge'
  | 'vote_reminder'
  | 'vote_tied'
  | 'vote_confirmed'
  | 'ai_complete'
  | 'mention'
  | 'participant_joined'
  | 'text_blast'
  | 'message';

export type NotificationTargetType =
  | 'photo'
  | 'feedback'
  | 'invitation'
  | 'mission'
  | 'participantLocations'
  | 'conversation';

export type Notification = {
  id: string;
  userId: string;
  actorUserId: string | null;
  type: NotificationType;
  content: string;
  targetType: NotificationTargetType | null;
  targetId: string | null;
  /** 알림이 속한 초대장 ID — photo/mission/feedback 등 sub-resource 알림의 라우팅 구성용 */
  invitationId: string | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
};

/** 커서 기반 알림 페이지 — nextCursor는 응답 data 본문에 포함(meta 아님). */
export type NotificationsPage = {
  items: Notification[];
  nextCursor: string | null;
  hasNext: boolean;
};

export function fetchNotifications(
  cursor?: string,
  limit = 20,
  opts: { signal?: AbortSignal } = {},
) {
  const params = new URLSearchParams({ limit: String(limit) });
  if (cursor) params.set('cursor', cursor);
  return apiFetch<NotificationsPage>(`/notifications?${params}`, { signal: opts.signal });
}

export function fetchUnreadCount(opts: { signal?: AbortSignal } = {}) {
  return apiFetch<{ count: number }>('/notifications/unread', { signal: opts.signal });
}

export function markNotificationAsRead(id: string) {
  return apiFetch<Notification>(`/notifications/${id}/read`, { method: 'PATCH' });
}

export function markAllNotificationsAsRead() {
  return apiFetch<void>('/notifications/readAll', { method: 'PATCH' });
}

// ── Query keys ───────────────────────────────────────────────────────────────
export const notificationKeys = {
  all: ['notifications'] as const,
  list: ['notifications', 'list'] as const,
  unread: ['notifications', 'unread'] as const,
};

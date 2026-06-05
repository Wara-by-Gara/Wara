import { apiGet, apiPatch, apiDelete } from './client';

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
  | 'ai_complete';

export type NotificationTargetType =
  | 'photo'
  | 'feedback'
  | 'invitation'
  | 'mission'
  | 'participantLocations';

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

export type NotificationSettings = {
  id: string;
  userId: string;
  isRemind: boolean;
  isFeedback: boolean;
  isInvitationDate: boolean;
  isPhoto: boolean;
  isMission: boolean;
  isParticipantLocations: boolean;
  isEventLocations: boolean;
  createdAt: string;
  updatedAt: string;
};

export type NotificationsPage = {
  items: Notification[];
  nextCursor: string | null;
  hasNext: boolean;
};

export type UpdateNotificationSettingsDto = Partial<
  Pick<
    NotificationSettings,
    | 'isRemind'
    | 'isFeedback'
    | 'isInvitationDate'
    | 'isPhoto'
    | 'isMission'
    | 'isParticipantLocations'
    | 'isEventLocations'
  >
>;

export function fetchNotifications(cursor?: string, limit = 20) {
  const params = new URLSearchParams({ limit: String(limit) });
  if (cursor) params.set('cursor', cursor);
  return apiGet<NotificationsPage>(`/notifications?${params}`);
}

export function fetchUnreadCount() {
  return apiGet<{ count: number }>('/notifications/unread');
}

export function deleteNotification(id: string) {
  return apiDelete(`/notifications/${id}`);
}

export function markAsRead(id: string) {
  return apiPatch<Notification>(`/notifications/${id}/read`, undefined);
}

export function markAllAsRead() {
  return apiPatch<void>('/notifications/readAll', undefined);
}

export async function fetchNotificationSettings(): Promise<NotificationSettings | null> {
  const result = await apiGet<NotificationSettings | null>('/notifications/settings');
  return result ?? null;
}

export function updateNotificationSettings(dto: UpdateNotificationSettingsDto) {
  return apiPatch<NotificationSettings>('/notifications/settings', dto);
}

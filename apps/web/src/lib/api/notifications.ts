import { apiClient } from '@/lib/api-client';

export type NotificationType =
  | 'remind'
  | 'participantLocations'
  | 'eventLocations'
  | 'feedback'
  | 'invitation_date'
  | 'photo';

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
  return apiClient<NotificationsPage>(`/notifications?${params}`);
}

export function fetchUnreadCount() {
  return apiClient<{ count: number }>('/notifications/unread');
}

export function markAsRead(id: string) {
  return apiClient<Notification>(`/notifications/${id}/read`, {
    method: 'PATCH',
  });
}

export function markAllAsRead() {
  return apiClient<void>('/notifications/readAll', { method: 'PATCH' });
}

export function fetchNotificationSettings() {
  return apiClient<NotificationSettings | null>('/notifications/settings');
}

export function updateNotificationSettings(dto: UpdateNotificationSettingsDto) {
  return apiClient<NotificationSettings>('/notifications/settings', {
    method: 'PATCH',
    body: JSON.stringify(dto),
  });
}

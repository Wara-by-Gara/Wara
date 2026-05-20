import { apiClient } from '@/lib/api-client';
import type {
  Notification,
  NotificationSettings,
  NotificationsPage,
  UpdateNotificationSettingsDto,
} from './types';

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

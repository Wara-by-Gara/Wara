'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Notifications } from '@/screens/Notifications';
import type { NotificationsState } from '@/screens/Notifications';
import {
  useNotifications,
  useMarkAsRead,
  useMarkAllAsRead,
  useDeleteNotification,
  useNotificationSettings,
  useUpdateNotificationSettings,
} from '@/hooks/useNotifications';
import { ROUTES } from '@/constants/routes';
import { NotificationSettingsSheet } from '@/components/notifications/notification-settings-sheet';
import { NotificationSettingsForm } from '@/components/notifications/notification-settings-form';
import type { NotificationSettingKey } from '@/components/notifications/notification-settings-form';
import type { NotificationType as WebNotificationType } from '@/components/organisms/NotificationItem';

const API_TO_WEB_TYPE: Record<string, WebNotificationType> = {
  photo: 'newPhoto',
  feedback: 'newComment',
  remind: 'eventReminder',
  arrived: 'newRsvp',
  nudge: 'hostNotice',
  invitation_date: 'invitationUpdated',
  participantLocations: 'invitationUpdated',
  eventLocations: 'invitationUpdated',
  ai_complete: 'newPhoto',
  vote_reminder: 'eventReminder',
  vote_tied: 'eventReminder',
  vote_confirmed: 'eventReminder',
};

export default function NotificationsContainer() {
  const router = useRouter();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [settingsOpen, setSettingsOpen] = useState(false);

  const { data, isLoading, isError, refetch } = useNotifications();
  const { mutate: markAsRead } = useMarkAsRead();
  const { mutate: markAllAsRead, isPending: isMarkingAllRead } = useMarkAllAsRead();
  const { mutate: deleteNotification } = useDeleteNotification();
  const { data: settings, isLoading: isSettingsLoading } = useNotificationSettings();
  const { mutate: updateSettings, isPending: isSettingsPending } = useUpdateNotificationSettings();

  const allItems = data?.pages.flatMap((p) => p.items) ?? [];
  const items = filter === 'unread' ? allItems.filter((n) => !n.isRead) : allItems;

  const mappedItems = items.map((n) => ({
    id: n.id,
    type: API_TO_WEB_TYPE[n.type] ?? 'invitationUpdated',
    title: n.content,
    time: new Date(n.createdAt).toLocaleString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
    unread: !n.isRead,
    onDelete: () => deleteNotification(n.id),
  }));

  const state: NotificationsState = isLoading
    ? 'loading'
    : isError
      ? 'error'
      : allItems.length === 0
        ? 'empty'
        : filter === 'unread'
          ? 'unreadOnly'
          : 'default';

  const VOTE_NOTIFICATION_TYPES = new Set(['vote_reminder', 'vote_tied', 'vote_confirmed']);

  const handleItemClick = (id: string) => {
    markAsRead(id);
    const notification = allItems.find((n) => n.id === id);
    if (!notification?.targetId) return;

    if (notification.targetType === 'invitation') {
      if (VOTE_NOTIFICATION_TYPES.has(notification.type)) {
        router.push(ROUTES.INVITATIONS.VOTE(notification.targetId));
      } else {
        router.push(ROUTES.INVITATIONS.DETAIL(notification.targetId));
      }
      return;
    }
    if (notification.targetType === 'participantLocations') {
      router.push(ROUTES.INVITATIONS.LOCATION(notification.targetId));
      return;
    }
    // sub-resource 라우팅 — invitationId가 있을 때만
    const invId = notification.invitationId;
    if (!invId) return;
    if (notification.targetType === 'photo') {
      router.push(ROUTES.INVITATIONS.PHOTO_DETAIL(invId, notification.targetId));
    } else if (notification.targetType === 'mission') {
      router.push(ROUTES.INVITATIONS.MISSION_DETAIL(invId, notification.targetId));
    } else if (notification.targetType === 'feedback') {
      router.push(ROUTES.INVITATIONS.FEEDBACKS(invId));
    }
  };

  return (
    <>
      <Notifications
        state={state}
        items={mappedItems}
        onMarkAllAsRead={() => markAllAsRead()}
        onMarkAsRead={handleItemClick}
        onFilterChange={setFilter}
        onRetry={() => refetch()}
        onSettings={() => setSettingsOpen(true)}
        isMarkingAllRead={isMarkingAllRead}
      />
      <NotificationSettingsSheet open={settingsOpen} onClose={() => setSettingsOpen(false)}>
        <NotificationSettingsForm
          settings={settings}
          isLoading={isSettingsLoading}
          isPending={isSettingsPending}
          onToggle={(key: NotificationSettingKey, value: boolean) =>
            updateSettings({ [key]: value })
          }
        />
      </NotificationSettingsSheet>
    </>
  );
}

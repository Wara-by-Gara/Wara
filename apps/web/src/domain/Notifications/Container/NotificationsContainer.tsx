'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Notifications } from '@/screens/Notifications';
import type { NotificationsState } from '@/screens/Notifications';
import {
  useNotifications,
  useMarkAsRead,
  useMarkAllAsRead,
  useNotificationSettings,
  useUpdateNotificationSettings,
  useNotificationSocket,
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
  ai_complete: 'albumOpened',
};

export default function NotificationsContainer() {
  const router = useRouter();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [pushPermission, setPushPermission] = useState<NotificationPermission | null>(null);

  useEffect(() => {
    if (typeof Notification !== 'undefined') {
      setPushPermission(Notification.permission);
    }
  }, []);

  const { data, isLoading, isError, refetch } = useNotifications();
  const { mutate: markAsRead } = useMarkAsRead();
  const { mutate: markAllAsRead, isPending: isMarkingAllRead } = useMarkAllAsRead();
  const { data: settings, isLoading: isSettingsLoading } = useNotificationSettings();
  const { mutate: updateSettings, isPending: isSettingsPending } = useUpdateNotificationSettings();

  useNotificationSocket();

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
  }));

  const handleRequestPushPermission = async () => {
    if (typeof Notification === 'undefined') return;
    const result = await Notification.requestPermission();
    setPushPermission(result);
  };

  const baseState: NotificationsState = isLoading
    ? 'loading'
    : isError
      ? 'error'
      : allItems.length === 0
        ? 'empty'
        : filter === 'unread'
          ? 'unreadOnly'
          : 'default';

  const state: NotificationsState =
    pushPermission === 'default' ? 'pushPermissionGuide' :
    pushPermission === 'denied' ? 'pushDisabledGuide' :
    baseState;

  const handleItemClick = (id: string) => {
    markAsRead(id);
    const notification = allItems.find((n) => n.id === id);
    if (notification?.targetType === 'invitation' && notification.targetId) {
      router.push(ROUTES.INVITATIONS.DETAIL(notification.targetId));
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
        onRequestPushPermission={handleRequestPushPermission}
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

'use client';

import { useState } from 'react';
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
import { NotificationSettingsSheet } from '@/components/notifications/notification-settings-sheet';
import { NotificationSettingsForm } from '@/components/notifications/notification-settings-form';
import type { NotificationSettingKey } from '@/components/notifications/notification-settings-form';

export default function NotificationsContainer() {
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [settingsOpen, setSettingsOpen] = useState(false);

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
    type: n.type,
    title: n.content,
    time: new Date(n.createdAt).toLocaleString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
    unread: !n.isRead,
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

  return (
    <>
      <Notifications
        state={state}
        items={mappedItems}
        onMarkAllAsRead={() => markAllAsRead()}
        onMarkAsRead={(id) => markAsRead(id)}
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

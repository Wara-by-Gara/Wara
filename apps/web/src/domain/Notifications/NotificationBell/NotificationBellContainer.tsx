'use client';

import { useState, useRef, useEffect } from 'react';
import {
  useUnreadCount,
  useNotifications,
  useMarkAsRead,
  useMarkAllAsRead,
  useNotificationSettings,
  useUpdateNotificationSettings,
  useNotificationSocket,
} from '@/hooks/useNotifications';
import { NotificationBell } from '@/components/notifications/notification-bell';
import { NotificationDropdown } from '@/components/notifications/notification-dropdown';
import { NotificationSettingsSheet } from '@/components/notifications/notification-settings-sheet';
import { NotificationSettingsForm } from '@/components/notifications/notification-settings-form';
import type { NotificationSettingKey } from '@/components/notifications/notification-settings-form';

export function NotificationBellContainer() {
  const [open, setOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const { data: unreadData } = useUnreadCount();
  const unreadCount = unreadData?.count ?? 0;

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useNotifications();
  const { mutate: markAsRead } = useMarkAsRead();
  const { mutate: markAllAsRead, isPending: isMarkingAllRead } = useMarkAllAsRead();

  const { data: settings, isLoading: isSettingsLoading } = useNotificationSettings();
  const { mutate: updateSettings, isPending: isSettingsPending } = useUpdateNotificationSettings();

  useNotificationSocket();

  const notifications = data?.pages.flatMap((p) => p.items) ?? [];

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <NotificationBell
        unreadCount={unreadCount}
        onClick={() => setOpen((prev) => !prev)}
      />
      {open && (
        <NotificationDropdown
          notifications={notifications}
          isLoading={isLoading}
          hasNextPage={hasNextPage ?? false}
          isFetchingNextPage={isFetchingNextPage}
          isMarkingAllRead={isMarkingAllRead}
          onMarkAsRead={(id) => markAsRead(id)}
          onMarkAllAsRead={() => markAllAsRead()}
          onLoadMore={() => fetchNextPage()}
          onOpenSettings={() => setSettingsOpen(true)}
        />
      )}
      {settingsOpen && (
        <NotificationSettingsSheet onClose={() => setSettingsOpen(false)}>
          <NotificationSettingsForm
            settings={settings}
            isLoading={isSettingsLoading}
            isPending={isSettingsPending}
            onToggle={(key: NotificationSettingKey, value: boolean) =>
              updateSettings({ [key]: value })
            }
          />
        </NotificationSettingsSheet>
      )}
    </div>
  );
}

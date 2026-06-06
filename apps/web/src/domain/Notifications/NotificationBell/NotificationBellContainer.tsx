'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/constants/routes';
import {
  useUnreadCount,
  useNotifications,
  useMarkAsRead,
  useMarkAllAsRead,
  useDeleteNotification,
  useNotificationSettings,
  useUpdateNotificationSettings,
} from '@/hooks/useNotifications';
import { NotificationBell } from '@/components/notifications/notification-bell';
import { NotificationDropdown } from '@/components/notifications/notification-dropdown';
import { NotificationSettingsSheet } from '@/components/notifications/notification-settings-sheet';
import { NotificationSettingsForm } from '@/components/notifications/notification-settings-form';
import type { NotificationSettingKey } from '@/components/notifications/notification-settings-form';

const VOTE_NOTIFICATION_TYPES = new Set(['vote_reminder', 'vote_tied', 'vote_confirmed']);

export function NotificationBellContainer() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const { data: unreadData } = useUnreadCount();
  const unreadCount = unreadData?.count ?? 0;

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useNotifications();
  const { mutate: markAsRead } = useMarkAsRead();
  const { mutate: markAllAsRead, isPending: isMarkingAllRead } =
    useMarkAllAsRead();
  const { mutate: deleteNotification } = useDeleteNotification();

  const { data: settings, isLoading: isSettingsLoading } =
    useNotificationSettings();
  const { mutate: updateSettings, isPending: isSettingsPending } =
    useUpdateNotificationSettings();

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
          onMarkAsRead={(id) => {
            markAsRead(id);
            const n = notifications.find((item) => item.id === id);
            if (!n?.targetId) return;

            if (n.targetType === 'invitation') {
              setOpen(false);
              if (VOTE_NOTIFICATION_TYPES.has(n.type)) {
                router.push(ROUTES.INVITATIONS.VOTE(n.targetId));
              } else {
                router.push(ROUTES.INVITATIONS.DETAIL(n.targetId));
              }
              return;
            }
            if (n.targetType === 'participantLocations') {
              setOpen(false);
              router.push(ROUTES.INVITATIONS.LOCATION(n.targetId));
              return;
            }
            const invId = n.invitationId;
            if (!invId) return;
            setOpen(false);
            if (n.targetType === 'photo') {
              router.push(ROUTES.INVITATIONS.DETAIL(invId));
            } else if (n.targetType === 'mission') {
              router.push(ROUTES.INVITATIONS.DETAIL(invId));
            } else if (n.targetType === 'feedback') {
              router.push(ROUTES.INVITATIONS.COMMENTS(invId));
            }
          }}
          onMarkAllAsRead={() => markAllAsRead()}
          onDelete={(id) => deleteNotification(id)}
          onLoadMore={() => fetchNextPage()}
          onOpenSettings={() => setSettingsOpen(true)}
        />
      )}
      <NotificationSettingsSheet
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      >
        <NotificationSettingsForm
          settings={settings}
          isLoading={isSettingsLoading}
          isPending={isSettingsPending}
          onToggle={(key: NotificationSettingKey, value: boolean) =>
            updateSettings({ [key]: value })
          }
        />
      </NotificationSettingsSheet>
    </div>
  );
}

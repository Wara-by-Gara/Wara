'use client';

import { useState } from 'react';
import { Notifications } from '@/screens/Notifications';
import type { NotificationsState } from '@/screens/Notifications';
import {
  useNotifications,
  useMarkAsRead,
  useMarkAllAsRead,
  useNotificationSocket,
} from '@/hooks/useNotifications';

export default function NotificationsContainer() {
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [markAllReadModalOpen, setMarkAllReadModalOpen] = useState(false);

  const { data, isLoading, isError, refetch } = useNotifications();
  const { mutate: markAsRead } = useMarkAsRead();
  const { mutate: markAllAsRead, isPending: isMarkingAllRead } =
    useMarkAllAsRead();

  useNotificationSocket();

  const allItems = data?.pages.flatMap((p) => p.items) ?? [];
  const items =
    filter === 'unread' ? allItems.filter((n) => !n.isRead) : allItems;

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
        : markAllReadModalOpen
          ? 'markAllReadModal'
          : filter === 'unread'
            ? 'unreadOnly'
            : 'default';

  return (
    <Notifications
      state={state}
      items={mappedItems}
      onMarkAllAsRead={() => {
        markAllAsRead();
        setMarkAllReadModalOpen(false);
      }}
      onMarkAsRead={(id) => markAsRead(id)}
      onFilterChange={setFilter}
      onRetry={() => refetch()}
      isMarkingAllRead={isMarkingAllRead}
    />
  );
}

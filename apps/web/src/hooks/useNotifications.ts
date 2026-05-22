'use client';

import { useEffect } from 'react';
import {
  useQuery,
  useMutation,
  useInfiniteQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { io } from 'socket.io-client';
import {
  fetchNotifications,
  fetchUnreadCount,
  markAsRead,
  markAllAsRead,
  fetchNotificationSettings,
  updateNotificationSettings,
} from '@/lib/api/notifications';
import type { UpdateNotificationSettingsDto } from '@/lib/api/notifications';

export const notificationKeys = {
  all: ['notifications'] as const,
  lists: () => [...notificationKeys.all, 'list'] as const,
  unread: () => [...notificationKeys.all, 'unread'] as const,
  settings: () => [...notificationKeys.all, 'settings'] as const,
};

export function useNotifications() {
  return useInfiniteQuery({
    queryKey: notificationKeys.lists(),
    queryFn: ({ pageParam }) =>
      fetchNotifications(pageParam as string | undefined),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: notificationKeys.unread(),
    queryFn: fetchUnreadCount,
    refetchInterval: 60_000,
  });
}

export function useMarkAsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: notificationKeys.unread() });
    },
  });
}

export function useMarkAllAsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: notificationKeys.unread() });
    },
  });
}

export function useNotificationSettings() {
  return useQuery({
    queryKey: notificationKeys.settings(),
    queryFn: fetchNotificationSettings,
  });
}

export function useUpdateNotificationSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: UpdateNotificationSettingsDto) =>
      updateNotificationSettings(dto),
    onSuccess: (data) => {
      queryClient.setQueryData(notificationKeys.settings(), data);
    },
  });
}

const SOCKET_URL =
  (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000') +
  '/notifications';

export function useNotificationSocket() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const token = localStorage.getItem('accessToken');

    const socket = io(SOCKET_URL, {
      auth: { token },
      withCredentials: true,
      transports: ['websocket'],
    });

    function invalidateNotifications() {
      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: notificationKeys.unread() });
    }

    socket.on('notification:new', invalidateNotifications);
    socket.on('notification:read', invalidateNotifications);
    socket.on('notification:readAll', invalidateNotifications);

    return () => {
      socket.disconnect();
    };
  }, [queryClient]);
}

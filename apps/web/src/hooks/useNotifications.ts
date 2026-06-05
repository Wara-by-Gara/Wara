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
  deleteNotification,
  fetchNotificationSettings,
  updateNotificationSettings,
} from '@/lib/api/notifications';
import type { UpdateNotificationSettingsDto, NotificationsPage } from '@/lib/api/notifications';
import { SOCKET_BASE } from '@/lib/env';
import { useNotificationSocketStore } from '@/stores/notificationSocketStore';
import { QUERY_KEYS } from '@/constants/queryKeys';

export interface AiCompleteEventDetail {
  jobId: string;
  invitationId: string;
  key: string | null;
  url: string | null;
  success: boolean;
}

export function useNotifications() {
  return useInfiniteQuery({
    queryKey: QUERY_KEYS.notifications.list(),
    queryFn: ({ pageParam }) =>
      fetchNotifications(pageParam as string | undefined),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}

export function useUnreadCount() {
  // 소켓이 연결되어 있으면 푸시로 알림이 들어오므로 폴링 불필요
  const socketConnected = useNotificationSocketStore((s) => s.connected);
  return useQuery({
    queryKey: QUERY_KEYS.notifications.unread(),
    queryFn: fetchUnreadCount,
    refetchInterval: socketConnected ? false : 60_000,
  });
}

interface InfiniteNotifications {
  pages: NotificationsPage[];
  pageParams: unknown[];
}

function markItemRead(data: InfiniteNotifications | undefined, id: string): InfiniteNotifications | undefined {
  if (!data) return data;
  const readAt = new Date().toISOString();
  return {
    ...data,
    pages: data.pages.map((page) => ({
      ...page,
      items: page.items.map((n) =>
        n.id === id ? { ...n, isRead: true, readAt } : n,
      ),
    })),
  };
}

export function useMarkAsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markAsRead,
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.notifications.list() });
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.notifications.unread() });

      const prevUnread = queryClient.getQueryData<{ count: number }>(QUERY_KEYS.notifications.unread());
      const prevList = queryClient.getQueryData<InfiniteNotifications>(QUERY_KEYS.notifications.list());

      // 리스트의 해당 알림이 unread였을 때만 카운트 감소
      const wasUnread = prevList?.pages.some((p) =>
        p.items.some((n) => n.id === id && !n.isRead),
      );
      if (wasUnread && prevUnread && prevUnread.count > 0) {
        queryClient.setQueryData(QUERY_KEYS.notifications.unread(), { count: prevUnread.count - 1 });
      }
      queryClient.setQueryData<InfiniteNotifications>(QUERY_KEYS.notifications.list(), (old) =>
        markItemRead(old, id),
      );

      return { prevUnread, prevList };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prevUnread) queryClient.setQueryData(QUERY_KEYS.notifications.unread(), ctx.prevUnread);
      if (ctx?.prevList) queryClient.setQueryData(QUERY_KEYS.notifications.list(), ctx.prevList);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notifications.list() });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notifications.unread() });
    },
  });
}

export function useDeleteNotification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteNotification,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notifications.list() });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notifications.unread() });
    },
  });
}

export function useMarkAllAsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markAllAsRead,
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.notifications.unread() });
      const prevUnread = queryClient.getQueryData<{ count: number }>(QUERY_KEYS.notifications.unread());
      queryClient.setQueryData(QUERY_KEYS.notifications.unread(), { count: 0 });
      return { prevUnread };
    },
    onError: (_err, _v, ctx) => {
      if (ctx?.prevUnread) queryClient.setQueryData(QUERY_KEYS.notifications.unread(), ctx.prevUnread);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notifications.list() });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notifications.unread() });
    },
  });
}

export function useNotificationSettings() {
  return useQuery({
    queryKey: QUERY_KEYS.notifications.settings(),
    queryFn: fetchNotificationSettings,
  });
}

export function useUpdateNotificationSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: UpdateNotificationSettingsDto) =>
      updateNotificationSettings(dto),
    onSuccess: (data) => {
      queryClient.setQueryData(QUERY_KEYS.notifications.settings(), data);
    },
  });
}

const SOCKET_URL = `${SOCKET_BASE}/notifications`;

export function useNotificationSocket() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const socket = io(SOCKET_URL, {
      withCredentials: true,
      transports: ['websocket'],
    });

    function invalidateNotifications() {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notifications.list() });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notifications.unread() });
    }

    socket.on('connect', () => {
      useNotificationSocketStore.setState({ connected: true });
    });
    socket.on('disconnect', () => {
      useNotificationSocketStore.setState({ connected: false });
    });

    socket.on('notification:new', (notification: { type: string; content: string }) => {
      // AI 완료 알림은 window 커스텀 이벤트로 브로드캐스트 (해당 컴포넌트에서 수신)
      if (notification.type === 'ai_complete') {
        try {
          const detail = JSON.parse(notification.content) as AiCompleteEventDetail;
          window.dispatchEvent(new CustomEvent('ai:complete', { detail }));
        } catch (err) {
          console.warn('[notification] ai_complete payload parse failed', err);
        }
      }
      invalidateNotifications();
    });
    socket.on('notification:read', invalidateNotifications);
    socket.on('notification:readAll', invalidateNotifications);

    return () => {
      socket.disconnect();
      useNotificationSocketStore.setState({ connected: false });
    };
  }, [queryClient]);
}

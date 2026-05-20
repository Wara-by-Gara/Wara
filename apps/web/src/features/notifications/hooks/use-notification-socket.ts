'use client';

import { useEffect } from 'react';
import { io } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { notificationKeys } from '../query-keys';

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

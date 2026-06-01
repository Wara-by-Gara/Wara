import Constants from 'expo-constants';
import { useEffect, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';

import { getAccessToken } from '@/api';

export type WsParticipantLocation = {
  id: string;
  participantId: string;
  invitationId: string;
  lat: number;
  lng: number;
  accuracy: number;
  isArrived: boolean;
  updatedAt: string;
};

function resolveWsBase(): string {
  const apiUrl = (Constants.expoConfig?.extra as { apiUrl?: string } | undefined)?.apiUrl;
  if (!apiUrl) throw new Error('API_URL이 설정되지 않았습니다.');
  // http://localhost:3000/api/v1 → http://localhost:3000
  return apiUrl.replace(/\/api\/v\d+\/?$/, '').replace(/\/+$/, '');
}

type Options = {
  invitationId: string;
  enabled?: boolean;
};

export function useLocationSocket({ invitationId, enabled = true }: Options) {
  const socketRef = useRef<Socket | null>(null);
  const [participantLocations, setParticipantLocations] = useState<
    Map<string, WsParticipantLocation>
  >(new Map());
  const [arrivedParticipantId, setArrivedParticipantId] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    let socket: Socket;

    async function connect() {
      const token = await getAccessToken();
      const wsBase = resolveWsBase();

      socket = io(`${wsBase}/locations`, {
        auth: { token: token ?? '' },
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 5,
      });
      socketRef.current = socket;

      socket.on('connect', () => {
        setConnected(true);
        socket.emit('location:subscribe', { invitationId });
      });

      socket.on('disconnect', () => setConnected(false));

      socket.on('location:updated', (data: WsParticipantLocation) => {
        setParticipantLocations((prev) => {
          const next = new Map(prev);
          next.set(data.participantId, data);
          return next;
        });
      });

      socket.on('location:arrived', (data: { participantId: string; invitationId: string }) => {
        setArrivedParticipantId(data.participantId);
      });
    }

    connect();

    return () => {
      if (socket) {
        socket.emit('location:unsubscribe', { invitationId });
        socket.disconnect();
      }
      socketRef.current = null;
      setConnected(false);
    };
  }, [invitationId, enabled]);

  function sendLocation(coords: {
    lat: number;
    lng: number;
    accuracy: number;
    isArrived?: boolean;
  }) {
    socketRef.current?.emit('location:update', { invitationId, ...coords });
  }

  return { participantLocations, arrivedParticipantId, connected, sendLocation };
}

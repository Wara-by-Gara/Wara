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
  nickname: string | null;
  profileImageUrl: string | null;
};

function resolveWsBase(): string {
  const apiUrl = (Constants.expoConfig?.extra as { apiUrl?: string } | undefined)?.apiUrl;
  if (!apiUrl) throw new Error('API_URL이 설정되지 않았습니다.');
  // extra.apiUrl은 origin만 들어오는 게 정상(예: http://10.0.2.2:3001).
  // 과거 prefix(/api/vN)가 들어오던 흔적은 방어적으로 제거 + trailing slash 정리.
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
  const [authError, setAuthError] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    let socket: Socket;

    async function connect() {
      const token = await getAccessToken();
      if (!token) {
        // 토큰 없이 WS 인증 불가 — 재시도해도 의미 없으니 시도조차 안 함.
        setAuthError(true);
        return;
      }
      const wsBase = resolveWsBase();

      socket = io(`${wsBase}/locations`, {
        auth: { token },
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 5,
      });
      socketRef.current = socket;

      socket.on('connect', () => {
        setConnected(true);
        setAuthError(false);
        socket.emit('location:subscribe', { invitationId });
      });

      socket.on('disconnect', () => setConnected(false));

      // 인증 실패는 reconnection으로 해결 안 됨 — 즉시 중단.
      // socket.io 서버는 middleware에서 reject 시 connect_error로 전달.
      socket.on('connect_error', (err) => {
        const msg = (err.message ?? '').toLowerCase();
        if (msg.includes('unauth') || msg.includes('token') || msg.includes('auth')) {
          setAuthError(true);
          socket.disconnect();
        }
      });

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

  return { participantLocations, arrivedParticipantId, connected, authError, sendLocation };
}

// 목적: Socket.IO 네임스페이스에 Bearer 토큰으로 연결하는 범용 훅.
// useLocationSocket과 동일한 origin·인증·transport 구성을 복제해
// AI/DM 등 여러 네임스페이스에서 재사용한다.
import Constants from 'expo-constants';
import { useEffect, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';

import { getAccessToken } from '@/api';

// extra.apiUrl은 origin만 들어오는 게 정상(예: http://10.0.2.2:3001).
// 과거 prefix(/api/vN)가 들어오던 흔적은 방어적으로 제거 + trailing slash 정리.
function resolveWsBase(): string {
  const apiUrl = (Constants.expoConfig?.extra as { apiUrl?: string } | undefined)?.apiUrl;
  if (!apiUrl) throw new Error('API_URL이 설정되지 않았습니다.');
  return apiUrl.replace(/\/api\/v\d+\/?$/, '').replace(/\/+$/, '');
}

type Options = {
  enabled?: boolean;
  onConnect?: (socket: Socket) => void;
  onConnectError?: (err: Error) => void;
  /** 이벤트명 → 핸들러. socket.on으로 등록/해제된다. */
  handlers?: Record<string, (payload: unknown) => void>;
};

// 명시적 반환 타입 — pnpm 중첩 node_modules에서 Socket의 emitter 타입 경로를
// 명명 못 하는 TS2742를 방지(A type annotation is necessary).
export type NamespaceSocket = { socket: Socket | null; connected: boolean };

export function useNamespaceSocket(namespace: string, opts: Options = {}): NamespaceSocket {
  const { enabled = true, onConnect, onConnectError, handlers } = opts;
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  // 콜백/핸들러는 매 렌더 새 참조라 deps에 넣으면 재연결이 폭주함.
  // ref로 최신 참조만 유지하고 effect deps에서는 제외한다.
  const onConnectRef = useRef(onConnect);
  const onConnectErrorRef = useRef(onConnectError);
  const handlersRef = useRef(handlers);
  onConnectRef.current = onConnect;
  onConnectErrorRef.current = onConnectError;
  handlersRef.current = handlers;

  // 토큰 변경(로그인/리프레시) 시 재연결되도록 token을 상태로 들고 deps에 포함.
  const [token, setToken] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    getAccessToken().then((t) => {
      if (!cancelled) setToken(t ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled || !token) return;

    const wsBase = resolveWsBase();
    const socket = io(`${wsBase}${namespace}`, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      onConnectRef.current?.(socket);
    });

    socket.on('disconnect', () => setConnected(false));

    socket.on('connect_error', (err: Error) => {
      onConnectErrorRef.current?.(err);
    });

    const registered = handlersRef.current ?? {};
    for (const [event, handler] of Object.entries(registered)) {
      socket.on(event, handler);
    }

    return () => {
      for (const [event, handler] of Object.entries(registered)) {
        socket.off(event, handler);
      }
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [namespace, enabled, token]);

  return { socket: socketRef.current, connected };
}

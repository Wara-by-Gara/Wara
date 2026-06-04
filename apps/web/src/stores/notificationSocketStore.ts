"use client";

import { create } from "zustand";

// 알림 WebSocket 연결 상태 — 폴링 fallback 여부 판단에 사용.
// useNotificationSocket이 연결/끊김에서 갱신, useUnreadCount가 구독해 refetchInterval 조정.
export const useNotificationSocketStore = create<{ connected: boolean }>(() => ({
  connected: false,
}));

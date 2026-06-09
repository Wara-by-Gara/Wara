"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/stores/authStore";
import { useDmGlobalSocket } from "@/hooks/useConversations";

// DM WebSocket을 앱 전역에서 1회만 연결 (목록/안읽음 배지 실시간 갱신).
// 로그인 상태에서만 활성화.
export function DmSocketMount() {
  const hydrated = useAuthStore((s) => s.hydrated);
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const hydrate = useAuthStore((s) => s.hydrate);

  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrated, hydrate]);

  if (!hydrated || !isLoggedIn) return null;
  return <SocketLifecycle />;
}

function SocketLifecycle() {
  useDmGlobalSocket();
  return null;
}

"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/stores/authStore";
import {
  useNotificationSocket,
  useUnreadCount,
} from "@/hooks/useNotifications";

// 알림 WebSocket을 앱 전역에서 1회만 연결하기 위한 마운트 컴포넌트.
// BellContainer / NotificationsContainer가 각자 useNotificationSocket()을 호출하면
// 두 페이지가 동시에 살아있을 때 같은 네임스페이스로 2 connection이 발생하므로
// 단일 위치(RootLayout)에서만 연결한다. 로그인 상태에서만 활성화.
export function NotificationSocketMount() {
  const hydrated = useAuthStore((s) => s.hydrated);
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);

  if (!hydrated || !isLoggedIn) return null;
  return <SocketLifecycle />;
}

// App Badging API — Chromium 계열 + iOS 홈 설치 PWA(Safari). 미지원 브라우저는 setter가 undefined.
type BadgeNavigator = Navigator & {
  setAppBadge?: (count?: number) => Promise<void>;
  clearAppBadge?: () => Promise<void>;
};

function SocketLifecycle() {
  useNotificationSocket();

  // 서버 발송 시 SW가 push payload.badge로 이미 배지를 갱신하지만,
  // (1) SW push 이벤트 없이 소켓만으로 미읽음이 바뀌는 경우
  // (2) 다른 세션에서 읽음 처리 후 이 세션이 최신 unread를 받은 경우
  // (3) 앱 첫 진입 시
  // 를 커버하기 위해 클라 side에서도 unread count → 배지 동기화.
  const { data: unread } = useUnreadCount();
  useEffect(() => {
    if (typeof window === "undefined") return;
    const nav = window.navigator as BadgeNavigator;
    const count = unread?.count ?? 0;
    void (async () => {
      try {
        if (count > 0) await nav.setAppBadge?.(count);
        else await nav.clearAppBadge?.();
      } catch {
        // 미지원/권한 거부 — 무시.
      }
    })();
  }, [unread?.count]);

  return null;
}

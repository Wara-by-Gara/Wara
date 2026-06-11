"use client";

import { useAuthStore } from "@/stores/authStore";
import { useNotificationSocket } from "@/hooks/useNotifications";

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

function SocketLifecycle() {
  useNotificationSocket();
  return null;
}

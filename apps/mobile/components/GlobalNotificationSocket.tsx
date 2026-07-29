// 전역 알림 소켓 mount — 알림 화면 밖에서도 실시간 이벤트를 수신해 캐시를 무효화한다.
// UI 없음. useNotificationSocket은 로그인 상태(access token)에서만 실제 연결한다.
import { useCallback, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import * as Notifications from 'expo-notifications';

import { notificationKeys } from '@/api/notifications';
import { useUnreadCount } from '@/hooks/queries/notifications';
import { useNotificationSocket } from '@/hooks/socket/useNotificationSocket';

export function GlobalNotificationSocket(): null {
  const qc = useQueryClient();

  const invalidate = useCallback(() => {
    qc.invalidateQueries({ queryKey: notificationKeys.list });
    qc.invalidateQueries({ queryKey: notificationKeys.unread });
  }, [qc]);

  useNotificationSocket({
    onNew: invalidate,
    onRead: invalidate,
    onReadAll: invalidate,
  });

  // iOS 홈 아이콘 배지 카운트 = 미읽음 총합.
  // 서버 push payload.badge로 이미 백그라운드/킬 상태 배지는 갱신되지만
  // (1) in-app 읽음 처리 (2) 다른 세션에서 읽음 (3) 앱 첫 진입 케이스를 커버.
  const unread = useUnreadCount();
  useEffect(() => {
    const count = unread.data ?? 0;
    void Notifications.setBadgeCountAsync(count).catch(() => {
      // 시뮬레이터·권한 미허가 등 — 배지 실패는 앱 흐름과 무관하므로 삼킴.
    });
  }, [unread.data]);

  return null;
}

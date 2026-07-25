// 전역 알림 소켓 mount — 알림 화면 밖에서도 실시간 이벤트를 수신해 캐시를 무효화한다.
// UI 없음. useNotificationSocket은 로그인 상태(access token)에서만 실제 연결한다.
import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { notificationKeys } from '@/api/notifications';
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

  return null;
}

// 목적: /notifications 네임스페이스를 구독해 신규 알림을 실시간 수신하는 훅.
// 서버 이벤트명은 apps/api/src/notifications/notifications.gateway.ts에서 확인:
//   - 'notification:new'     Notification 객체 (신규/DM upsert)
//   - 'notification:read'    { id }          (다른 세션에서 읽음 처리)
//   - 'notification:readAll'                 (다른 세션에서 전체 읽음)
// 이 Phase에서는 신규 수신(onNew)만 콜백으로 노출한다.
import { useNamespaceSocket, type NamespaceSocket } from './useNamespaceSocket';

type Options = {
  enabled?: boolean;
  onNew?: (n: unknown) => void;
};

export function useNotificationSocket(opts: Options = {}): NamespaceSocket {
  const { enabled = true, onNew } = opts;

  return useNamespaceSocket('/notifications', {
    enabled,
    handlers: {
      'notification:new': (payload) => {
        onNew?.(payload);
      },
    },
  });
}

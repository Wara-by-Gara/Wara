// 목적: /notifications 네임스페이스를 구독해 알림 이벤트를 실시간 수신하는 훅.
// 서버 이벤트명은 apps/api/src/notifications/notifications.gateway.ts에서 확인:
//   - 'notification:new'     Notification 객체 (신규/DM upsert)
//   - 'notification:read'    { id }          (다른 세션에서 읽음 처리)
//   - 'notification:readAll'                 (다른 세션에서 전체 읽음)
import { useNamespaceSocket, type NamespaceSocket } from './useNamespaceSocket';

type Options = {
  enabled?: boolean;
  onNew?: (n: unknown) => void;
  onRead?: (id: string) => void;
  onReadAll?: () => void;
};

export function useNotificationSocket(opts: Options = {}): NamespaceSocket {
  const { enabled = true, onNew, onRead, onReadAll } = opts;

  return useNamespaceSocket('/notifications', {
    enabled,
    handlers: {
      'notification:new': (payload) => {
        onNew?.(payload);
      },
      'notification:read': (payload) => {
        const id =
          payload && typeof payload === 'object' && 'id' in payload
            ? String((payload as { id: unknown }).id)
            : null;
        if (id) onRead?.(id);
      },
      'notification:readAll': () => {
        onReadAll?.();
      },
    },
  });
}

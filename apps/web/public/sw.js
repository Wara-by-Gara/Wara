/* WARA Service Worker — Web Push 수신/표시 전용 (오프라인 캐싱 없음).
   페이로드 형태는 apps/api PushService.PushPayload와 일치: { title, body, url, tag } */

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: 'WARA', body: event.data.text(), url: '/notifications' };
  }
  const title = payload.title || 'WARA';
  const body = payload.body || '';
  const url = payload.url || '/notifications';
  const tag = payload.tag;

  event.waitUntil(
    (async () => {
      // DM 알림: 해당 대화방을 보고 있는 포커스 탭이 있으면 OS 알림 생략
      // (이미 in-app 소켓으로 실시간 수신 중이라 중복).
      if (url.startsWith('/chats/')) {
        const targetPath = url.split('?')[0];
        const wins = await self.clients.matchAll({
          type: 'window',
          includeUncontrolled: true,
        });
        const viewing = wins.some(
          (c) => c.focused && new URL(c.url).pathname === targetPath,
        );
        if (viewing) return;
      }

      await self.registration.showNotification(title, {
        body,
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-192.png',
        data: { url },
        tag,
        renotify: !!tag,
      });
    })(),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url =
    (event.notification.data && event.notification.data.url) || '/notifications';

  event.waitUntil(
    (async () => {
      const target = new URL(url, self.location.origin);
      const wins = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      });
      // 같은 origin 탭이 있으면 포커스 후 해당 경로로 이동, 없으면 새 창.
      for (const c of wins) {
        if (new URL(c.url).origin === target.origin && 'focus' in c) {
          await c.focus();
          if ('navigate' in c) {
            try {
              await c.navigate(url);
            } catch {
              /* 일부 브라우저는 navigate 미지원 — 포커스만 */
            }
          }
          return;
        }
      }
      await self.clients.openWindow(url);
    })(),
  );
});

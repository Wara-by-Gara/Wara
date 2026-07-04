/// <reference lib="webworker" />
/* WARA Service Worker — Serwist 프리캐시/런타임 캐싱 + Web Push 수신/표시.
   push 페이로드 형태는 apps/api PushService.PushPayload와 일치: { title, body, url, tag } */

import { defaultCache } from '@serwist/next/worker';
import type { PrecacheEntry, SerwistGlobalConfig } from 'serwist';
import { NetworkOnly, Serwist } from 'serwist';

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  // 기존 수동 SW의 skipWaiting/clients.claim 동작 유지
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    // /api/* 는 백엔드 프록시(인증·개인화 데이터) — 절대 캐싱하지 않음.
    // defaultCache의 apis 항목(NetworkFirst)보다 먼저 매칭되어야 하므로 최상단.
    {
      matcher: ({ url, sameOrigin }) => sameOrigin && url.pathname.startsWith('/api/'),
      handler: new NetworkOnly(),
    },
    ...defaultCache,
  ],
  fallbacks: {
    entries: [
      {
        url: '/offline',
        matcher({ request }) {
          return request.destination === 'document';
        },
      },
    ],
  },
});

serwist.addEventListeners();

interface PushPayload {
  title?: string;
  body?: string;
  url?: string;
  tag?: string;
}

self.addEventListener('push', (event) => {
  if (!event.data) return;

  let payload: PushPayload;
  try {
    payload = event.data.json() as PushPayload;
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
        // Chromium 계열 전용 옵션 — 표준 타입에 없어 단언 필요
        ...( { renotify: !!tag } as NotificationOptions),
      });
    })(),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url: string =
    (event.notification.data && (event.notification.data as { url?: string }).url) ||
    '/notifications';

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

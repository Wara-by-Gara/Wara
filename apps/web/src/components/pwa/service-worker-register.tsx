'use client';

import { useEffect } from 'react';

// Web Push용 Service Worker(/sw.js) 등록. 전역 1회 마운트.
// 구독(usePushSubscription)은 navigator.serviceWorker.ready를 기다리므로 여기서 등록만 한다.
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // 등록 실패는 치명적이지 않음 — in-app 실시간 알림은 계속 동작.
    });
  }, []);

  return null;
}

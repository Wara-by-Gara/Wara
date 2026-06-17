'use client';

import { useCallback } from 'react';
import {
  fetchVapidPublicKey,
  subscribePush,
  unsubscribePush,
} from '@/lib/api/push';

function isPushSupported(): boolean {
  if (typeof window === 'undefined') return false;
  if (!('serviceWorker' in navigator)) return false;
  if (!('PushManager' in window)) return false;
  if (typeof Notification === 'undefined') return false;

  // iOS는 홈화면에 설치된 PWA(standalone)에서만 Web Push 지원.
  // 미설치 Safari는 구독 자체를 skip (in-app 소켓 실시간만 사용).
  const ua = navigator.userAgent;
  const isIOS = /iP(hone|od|ad)/.test(ua);
  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
  if (isIOS && !isStandalone) return false;

  return true;
}

export function usePushSubscription() {
  // 권한 granted + 지원 환경에서 구독 생성 후 백엔드 등록. (권한 요청은 호출 측에서 먼저 수행)
  const enable = useCallback(async () => {
    if (!isPushSupported()) return;
    if (Notification.permission !== 'granted') return;

    const { publicKey } = await fetchVapidPublicKey();
    if (!publicKey) return; // 서버에 VAPID 미설정 — 푸시 비활성

    const registration = await navigator.serviceWorker.ready;
    const existing = await registration.pushManager.getSubscription();
    const subscription =
      existing ??
      (await registration.pushManager.subscribe({
        userVisibleOnly: true,
        // base64url 문자열 형식 — 표준 사양상 PushManager가 직접 디코드 (모던 브라우저 지원)
        applicationServerKey: publicKey,
      }));

    const json = subscription.toJSON() as {
      endpoint?: string;
      keys?: { p256dh?: string; auth?: string };
    };
    if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) return;

    await subscribePush(
      {
        endpoint: json.endpoint,
        keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
      },
      crypto.randomUUID(),
    );
  }, []);

  // 로그아웃/해제 — 로컬 구독 해지 + 백엔드 soft delete
  const disable = useCallback(async () => {
    if (!isPushSupported()) return;
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (!subscription) return;
    const endpoint = subscription.endpoint;
    await subscription.unsubscribe().catch(() => {});
    await unsubscribePush(endpoint);
  }, []);

  return { enable, disable, isSupported: isPushSupported() };
}

import { apiGet, apiPost, apiDelete } from './client';

export type WebPushSubscriptionJson = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
};

export function fetchVapidPublicKey() {
  return apiGet<{ publicKey: string | null }>('/push/vapid-public-key');
}

export function subscribePush(
  sub: WebPushSubscriptionJson,
  idempotencyKey: string,
) {
  return apiPost<unknown>('/push/subscriptions', sub, { idempotencyKey });
}

export function unsubscribePush(endpoint: string) {
  return apiDelete('/push/subscriptions', { endpoint });
}

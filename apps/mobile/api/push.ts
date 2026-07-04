// 목적: Expo 푸시(기기) 토큰 서버 등록/해제 API. 서버 계약: apps/api push.controller.ts.
//  - POST   /push/device   { token, platform, deviceId?, deviceName?, appVersion? } → DeviceToken
//  - DELETE /push/device   { token } → 204 No Content
// iOS 전용 앱이므로 platform은 항상 'ios'. 등록은 token UNIQUE 기준 upsert(자연 멱등).
import { apiFetch, newIdempotencyKey } from '@/api';

export type DevicePlatform = 'ios' | 'android';

export type RegisterDeviceMeta = {
  deviceId?: string;
  deviceName?: string;
  appVersion?: string;
};

/** 서버가 반환하는 device_tokens 레코드. */
export type DeviceToken = {
  id: string;
  userId: string;
  token: string;
  platform: DevicePlatform;
  deviceId: string | null;
  deviceName: string | null;
  appVersion: string | null;
  lastSeenAt: string;
  createdAt: string;
  deletedAt: string | null;
};

/** Expo 푸시 토큰 등록/갱신(upsert). iOS 전용이라 platform은 'ios' 고정. */
export function registerPushToken(
  token: string,
  meta: RegisterDeviceMeta = {},
): Promise<DeviceToken> {
  return apiFetch<DeviceToken>('/push/device', {
    method: 'POST',
    body: { token, platform: 'ios', ...meta },
    idempotencyKey: newIdempotencyKey(),
  });
}

/** Expo 푸시 토큰 해제(로그아웃·알림 끄기). */
export function unregisterPushToken(token: string): Promise<void> {
  return apiFetch<void>('/push/device', {
    method: 'DELETE',
    body: { token },
  });
}

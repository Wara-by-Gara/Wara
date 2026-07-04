// 리마인드 수신 설정 API — 별도 reminder 엔드포인트가 없어 알림설정(GET/PATCH
// /notifications/settings)의 isRemind(모임 리마인드 수신 on/off)를 활용한다.
// 발송 시점(모임 전날/후 7·30일)은 서버가 remind_logs로 자동 발송하며 사용자 조정 불가.
// 응답 timestamp는 JSON 직렬화로 ISO 문자열. 웹 apps/web/src/lib/api/notifications.ts와 정합.

import { apiFetch } from './client';

/** 알림 수신 설정(사용자당 1행). 리마인드 화면은 isRemind만 사용. */
export type NotificationSettings = {
  id: string;
  userId: string;
  isRemind: boolean;
  isFeedback: boolean;
  isInvitationDate: boolean;
  isPhoto: boolean;
  isMission: boolean;
  isMessage: boolean;
  isParticipant: boolean;
  isParticipantLocations: boolean;
  isEventLocations: boolean;
  createdAt: string;
  updatedAt: string;
};

/** PATCH 페이로드 — 변경할 항목만 부분 전송. */
export type UpdateNotificationSettingsPayload = Partial<
  Pick<
    NotificationSettings,
    | 'isRemind'
    | 'isFeedback'
    | 'isInvitationDate'
    | 'isPhoto'
    | 'isMission'
    | 'isMessage'
    | 'isParticipant'
    | 'isParticipantLocations'
    | 'isEventLocations'
  >
>;

// ── 조회 ────────────────────────────────────────────────────────────────────

/** GET /notifications/settings — 설정 행이 없으면 서버가 빈 응답 → null. 이 경우 클라는 기본값(모두 true)로 취급. */
export function fetchNotificationSettings(
  opts: { signal?: AbortSignal } = {},
): Promise<NotificationSettings | null> {
  return apiFetch<NotificationSettings | null>('/notifications/settings', {
    signal: opts.signal,
  }).then((r) => r ?? null);
}

// ── 변경 ────────────────────────────────────────────────────────────────────

/** PATCH /notifications/settings — 없으면 upsert되어 갱신된 설정 반환. */
export function updateNotificationSettings(payload: UpdateNotificationSettingsPayload) {
  return apiFetch<NotificationSettings>('/notifications/settings', {
    method: 'PATCH',
    body: payload,
  });
}

// ── Query keys ───────────────────────────────────────────────────────────────
export const reminderKeys = {
  settings: ['notification-settings'] as const,
};

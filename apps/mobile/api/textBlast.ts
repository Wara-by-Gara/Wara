// 단체 공지(Text Blast) API — 웹(apps/web/src/lib/api/textBlasts.ts) 계약 미러.
// 목록은 참가자 열람 가능, 발송/삭제는 HOST 전용 (403 INSUFFICIENT_ROLE).

import { apiFetch, newIdempotencyKey } from './client';

export type TextBlast = {
  id: string;
  invitationId: string;
  message: string;
  recipientCount: number;
  createdAt: string;
};

/** GET /invitations/:invitationId/text-blasts — 보낸 공지 목록. */
export function fetchTextBlasts(invitationId: string, opts: { signal?: AbortSignal } = {}) {
  return apiFetch<TextBlast[]>(`/invitations/${invitationId}/text-blasts`, {
    signal: opts.signal,
  });
}

/** POST /invitations/:invitationId/text-blasts — 참석자 전원에게 공지 발송 (HOST 전용). */
export function createTextBlast(invitationId: string, message: string) {
  return apiFetch<TextBlast>(`/invitations/${invitationId}/text-blasts`, {
    method: 'POST',
    body: { message },
    idempotencyKey: newIdempotencyKey(),
  });
}

/** DELETE /invitations/:invitationId/text-blasts/:id — 공지 삭제 (HOST 전용, 204). */
export function deleteTextBlast(invitationId: string, id: string) {
  return apiFetch<void>(`/invitations/${invitationId}/text-blasts/${id}`, {
    method: 'DELETE',
  });
}

// ── Query keys ───────────────────────────────────────────────────────────────
export const textBlastKeys = {
  list: (invitationId: string) => ['invitations', 'text-blasts', invitationId] as const,
};

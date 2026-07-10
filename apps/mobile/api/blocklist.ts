// 차단 목록 API — 웹 apps/web/src/lib/api/blocklist.ts 포팅.
// 초대장 단위로 호스트가 차단한 사용자 조회/해제.

import { apiFetch } from './client';

export type BlockedUser = {
  userId: string;
  name: string | null;
  nickname: string | null;
  profileImageUrl: string | null;
  reason: string | null;
  blockedAt: string;
};

export function getBlocklist(invitationId: string, opts: { signal?: AbortSignal } = {}) {
  return apiFetch<{ data: BlockedUser[] }>(`/invitations/${invitationId}/blocklist`, {
    signal: opts.signal,
  });
}

export function unblockUser(invitationId: string, userId: string) {
  return apiFetch<void>(`/invitations/${invitationId}/blocklist/${userId}`, {
    method: 'DELETE',
  });
}

// ── Query keys ───────────────────────────────────────────────────────────────
export const blocklistKeys = {
  all: ['blocklist'] as const,
  list: (invitationId: string) => ['blocklist', 'list', invitationId] as const,
};

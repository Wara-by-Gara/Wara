// 친구 API — 웹 apps/web/src/lib/api/friends.ts 포팅.
// 같은 모임 참여로 자동 추가된 친구 목록/프로필/숨김/복원.

import { apiFetch, newIdempotencyKey } from './client';

export type Friend = {
  id: string;
  name: string | null;
  avatarUrl: string | null;
  /** 함께한 모임 수 */
  sharedCount: number;
  /** 가장 최근 함께한 모임 제목 */
  lastSharedTitle: string;
  /** 최근 함께한 시점 (ISO 문자열) */
  lastSharedAt: string | null;
};

export type MutualFriend = {
  id: string;
  name: string | null;
  avatarUrl: string | null;
};

export type SharedInvitation = {
  id: string;
  title: string;
  eventStartAt: string | null;
  status: 'active' | 'closed';
  isHostedByMe: boolean;
  imageUrl: string | null;
  location: string | null;
};

export type FriendProfile = {
  id: string;
  name: string | null;
  avatarUrl: string | null;
  sharedCount: number;
  mutualFriends: MutualFriend[];
  sharedInvitations: SharedInvitation[];
};

export type HiddenFriend = {
  id: string;
  name: string | null;
  avatarUrl: string | null;
  hiddenAt: string;
};

export function fetchFriends(opts: { signal?: AbortSignal } = {}) {
  return apiFetch<{ friends: Friend[] }>('/friends', { signal: opts.signal });
}

export function fetchFriendProfile(id: string, opts: { signal?: AbortSignal } = {}) {
  return apiFetch<FriendProfile>(`/friends/${id}`, { signal: opts.signal });
}

export function fetchHiddenFriends(opts: { signal?: AbortSignal } = {}) {
  return apiFetch<{ friends: HiddenFriend[] }>('/friends/hidden', { signal: opts.signal });
}

/** 친구 삭제 (영구 숨김) */
export function hideFriend(id: string) {
  return apiFetch<void>(`/friends/${id}`, { method: 'DELETE' });
}

/** 삭제한 친구 복원 */
export function restoreFriend(id: string) {
  return apiFetch<void>(`/friends/${id}/restore`, {
    method: 'POST',
    idempotencyKey: newIdempotencyKey(),
  });
}

// ── Query keys ───────────────────────────────────────────────────────────────
export const friendKeys = {
  all: ['friends'] as const,
  list: () => ['friends', 'list'] as const,
  hidden: () => ['friends', 'hidden'] as const,
  detail: (id: string) => ['friends', 'detail', id] as const,
};

import { apiGet, apiPost, apiDelete } from './client';

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
};

export type FriendProfile = {
  id: string;
  name: string | null;
  avatarUrl: string | null;
  sharedCount: number;
  mutualFriends: MutualFriend[];
  sharedInvitations: SharedInvitation[];
};

export function fetchFriends() {
  return apiGet<{ friends: Friend[] }>('/friends');
}

export function fetchFriendProfile(id: string) {
  return apiGet<FriendProfile>(`/friends/${id}`);
}

export type HiddenFriend = {
  id: string;
  name: string | null;
  avatarUrl: string | null;
  hiddenAt: string;
};

/** 친구 삭제 (영구 숨김) */
export function hideFriend(id: string) {
  return apiDelete(`/friends/${id}`);
}

/** 삭제한 친구 복원 */
export function restoreFriend(id: string) {
  return apiPost<void>(`/friends/${id}/restore`);
}

export function fetchHiddenFriends() {
  return apiGet<{ friends: HiddenFriend[] }>('/friends/hidden');
}

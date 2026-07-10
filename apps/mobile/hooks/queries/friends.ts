// 친구/차단 TanStack Query 훅.
// api/index.ts를 건드리지 않으므로 서브모듈에서 직접 import.

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  fetchFriends,
  fetchFriendProfile,
  fetchHiddenFriends,
  friendKeys,
  hideFriend,
  restoreFriend,
} from '@/api/friends';
import { blocklistKeys, getBlocklist, unblockUser } from '@/api/blocklist';

// ── 친구 ─────────────────────────────────────────────────────────────────────

export function useFriends() {
  return useQuery({
    queryKey: friendKeys.list(),
    queryFn: ({ signal }) => fetchFriends({ signal }),
  });
}

export function useHiddenFriends() {
  return useQuery({
    queryKey: friendKeys.hidden(),
    queryFn: ({ signal }) => fetchHiddenFriends({ signal }),
  });
}

export function useFriendProfile(id: string) {
  return useQuery({
    queryKey: friendKeys.detail(id),
    queryFn: ({ signal }) => fetchFriendProfile(id, { signal }),
    enabled: !!id,
  });
}

/** 친구 목록·숨김 목록을 함께 무효화 (숨김/복원으로 두 목록이 동시에 바뀜). */
function useFriendListInvalidation() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: friendKeys.list() });
    qc.invalidateQueries({ queryKey: friendKeys.hidden() });
  };
}

export function useHideFriend() {
  const invalidate = useFriendListInvalidation();
  return useMutation({
    mutationFn: (id: string) => hideFriend(id),
    onSuccess: invalidate,
  });
}

export function useRestoreFriend() {
  const invalidate = useFriendListInvalidation();
  return useMutation({
    mutationFn: (id: string) => restoreFriend(id),
    onSuccess: invalidate,
  });
}

// ── 차단 목록 ────────────────────────────────────────────────────────────────

export function useBlocklist(invitationId: string) {
  return useQuery({
    queryKey: blocklistKeys.list(invitationId),
    queryFn: ({ signal }) => getBlocklist(invitationId, { signal }),
    enabled: !!invitationId,
  });
}

export function useUnblockUser(invitationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => unblockUser(invitationId, userId),
    onSuccess: () => qc.invalidateQueries({ queryKey: blocklistKeys.list(invitationId) }),
  });
}

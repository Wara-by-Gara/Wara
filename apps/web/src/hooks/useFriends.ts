'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchFriends,
  fetchFriendProfile,
  fetchHiddenFriends,
  hideFriend,
  restoreFriend,
  type Friend,
} from '@/lib/api/friends';
import { QUERY_KEYS } from '@/constants/queryKeys';

const RECENT_FRIENDS_LIMIT = 10;

function pickRecentFriends(friends: Friend[]): Friend[] {
  return [...friends]
    .filter((f) => f.lastSharedAt !== null)
    .sort((a, b) => (b.lastSharedAt ?? '').localeCompare(a.lastSharedAt ?? ''))
    .slice(0, RECENT_FRIENDS_LIMIT);
}

export function useFriends() {
  const query = useQuery({
    queryKey: QUERY_KEYS.friends.list(),
    queryFn: fetchFriends,
  });

  const friends = query.data?.friends ?? [];
  const recentFriends = pickRecentFriends(friends);

  return { ...query, friends, recentFriends };
}

export function useFriendProfile(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.friends.detail(id),
    queryFn: () => fetchFriendProfile(id),
    enabled: Boolean(id),
  });
}

export function useHiddenFriends() {
  return useQuery({
    queryKey: QUERY_KEYS.friends.hidden(),
    queryFn: fetchHiddenFriends,
  });
}

export function useHideFriend() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => hideFriend(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.friends.list() });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.friends.hidden() });
    },
  });
}

export function useRestoreFriend() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => restoreFriend(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.friends.list() });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.friends.hidden() });
    },
  });
}

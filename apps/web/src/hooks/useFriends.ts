'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchFriends, fetchFriendProfile, type Friend } from '@/lib/api/friends';
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

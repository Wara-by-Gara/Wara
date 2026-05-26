import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { getMe } from '@/lib/api/users';

export function useMe() {
  const token = typeof window !== 'undefined' ? (localStorage.getItem('access_token') ?? '') : '';
  return useQuery({
    queryKey: QUERY_KEYS.users.me(),
    queryFn: () => getMe(token),
    enabled: !!token,
  });
}

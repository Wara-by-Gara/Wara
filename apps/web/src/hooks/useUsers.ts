import { useQuery } from '@tanstack/react-query';
import { getMe } from '@/lib/api/users';
import { QUERY_KEYS } from '@/constants/queryKeys';

export function useMe() {
  return useQuery({
    queryKey: QUERY_KEYS.users.me(),
    queryFn: () => {
      const token = localStorage.getItem('access_token') ?? '';
      return getMe(token);
    },
  });
}

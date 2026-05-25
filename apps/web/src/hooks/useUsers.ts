import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getMe, updateMe } from '@/lib/api/users';
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

export function useUpdateMe() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (nickname: string) => {
      const token = localStorage.getItem('access_token') ?? '';
      return updateMe({ nickname }, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.users.me() });
    },
  });
}

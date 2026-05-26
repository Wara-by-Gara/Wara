import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { getMe, updateMe, type UpdateMeInput } from '@/lib/api/users';

export function useMe() {
  const token = typeof window !== 'undefined' ? (localStorage.getItem('access_token') ?? '') : '';
  return useQuery({
    queryKey: QUERY_KEYS.users.me(),
    queryFn: () => getMe(token),
    enabled: !!token,
  });
}

export function useUpdateMe() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateMeInput) => {
      const token = localStorage.getItem('access_token') ?? '';
      return updateMe(data, token);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.users.me() }),
  });
}

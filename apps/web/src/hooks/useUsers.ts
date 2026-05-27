"use client";

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { deleteMe, deleteMySocial, getMe, getMySocials, updateMe, type UpdateMeInput } from '@/lib/api/users';
import { QUERY_KEYS } from '@/constants/queryKeys';

export function useMe() {
  const isLoggedIn = typeof window !== 'undefined'
    ? document.cookie.includes('is_logged_in=1')
    : false;
  return useQuery({
    queryKey: QUERY_KEYS.users.me(),
    queryFn: () => getMe(),
    enabled: isLoggedIn,
  });
}

export function useUpdateMe() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateMeInput) => updateMe(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.users.me() }),
  });
}

export function useDeleteMe() {
  return useMutation({
    mutationFn: () => deleteMe(),
  });
}

export function useGetMySocials() {
  return useQuery({
    queryKey: QUERY_KEYS.users.socials(),
    queryFn: () => getMySocials(),
  });
}

export function useDeleteMySocial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (provider: string) => deleteMySocial(provider),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.users.socials() });
    },
  });
}

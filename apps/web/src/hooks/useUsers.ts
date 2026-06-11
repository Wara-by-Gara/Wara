"use client";

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { deleteMe, deleteMySocial, getMe, getMySocials, getUserProfile, linkSocialUrl, mergeAccounts, updateMe, type DeleteMeInput, type UpdateMeInput } from '@/lib/api/users';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { useAuthStore } from '@/stores/authStore';
import { useTermsCompliance } from '@/hooks/useTermsCompliance';

export function useUserProfile(userId: string | null | undefined) {
  return useQuery({
    queryKey: ['users', userId, 'profile'],
    queryFn: () => getUserProfile(userId!),
    enabled: !!userId,
  });
}

export function useMe() {
  const { isLoggedIn, hydrated } = useAuthStore();
  const { isCompliant } = useTermsCompliance();

  return useQuery({
    queryKey: QUERY_KEYS.users.me(),
    queryFn: () => getMe(),
    enabled: hydrated && isLoggedIn && isCompliant === true,
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
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: DeleteMeInput = {}) => deleteMe(payload),
    onSuccess: () => queryClient.clear(),
  });
}

export function useGetMySocials() {
  const { isLoggedIn, hydrated } = useAuthStore();
  const { isCompliant } = useTermsCompliance();
  return useQuery({
    queryKey: QUERY_KEYS.users.socials(),
    queryFn: () => getMySocials(),
    enabled: hydrated && isLoggedIn && isCompliant === true,
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

export function useLinkSocialUrl() {
  return useMutation({
    mutationFn: (provider: string) => linkSocialUrl(provider),
  });
}

export function useMergeAccounts() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (mergeToken: string) => mergeAccounts(mergeToken),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.users.socials() });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.users.me() });
    },
  });
}

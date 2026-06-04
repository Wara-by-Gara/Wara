"use client";

import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { deleteMe, deleteMySocial, getMe, getMySocials, getUserProfile, updateMe, type UpdateMeInput } from '@/lib/api/users';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { isLoggedInCookieSet } from '@/lib/auth-cookie';

export function useUserProfile(userId: string | null | undefined) {
  return useQuery({
    queryKey: ['users', userId, 'profile'],
    queryFn: () => getUserProfile(userId!),
    enabled: !!userId,
  });
}

export function useMe() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setIsLoggedIn(isLoggedInCookieSet());
  }, []);

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
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => deleteMe(),
    onSuccess: () => queryClient.clear(),
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

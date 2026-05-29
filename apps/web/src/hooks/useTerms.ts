'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { agreeTerms, getMyAgreements, getTerms } from '@/lib/api/terms';
import { useAuthStore } from '@/stores/authStore';

export function useTerms() {
  return useQuery({
    queryKey: QUERY_KEYS.terms.all(),
    queryFn: getTerms,
  });
}

export function useMyAgreements() {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  return useQuery({
    queryKey: QUERY_KEYS.terms.agreements(),
    queryFn: getMyAgreements,
    enabled: isLoggedIn,
  });
}

export function useAgreeTerms() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: agreeTerms,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.terms.agreements() }),
  });
}

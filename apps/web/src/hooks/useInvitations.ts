"use client";

import { useQuery } from "@tanstack/react-query";
import { getInvitation, getMyInvitations, getHiddenInvitations } from "@/lib/api/invitations";
import { QUERY_KEYS } from "@/constants/queryKeys";
import { useAuthStore } from "@/stores/authStore";
import { useTermsCompliance } from "@/hooks/useTermsCompliance";

export function useInvitation(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.invitations.detail(id),
    queryFn: () => getInvitation(id),
    enabled: !!id,
  });
}

export function useMyInvitations() {
  // 비로그인 상태에서 401 fetch가 콘솔 에러로 누적되는 것 방지.
  // hydrate 완료 + 로그인 + 약관 동의 완료된 경우에만 호출.
  const { hydrated, isLoggedIn } = useAuthStore();
  const { isCompliant } = useTermsCompliance();
  return useQuery({
    queryKey: QUERY_KEYS.invitations.all(),
    queryFn: () => getMyInvitations(),
    enabled: hydrated && isLoggedIn && isCompliant === true,
  });
}

export function useHiddenInvitations() {
  return useQuery({
    queryKey: QUERY_KEYS.invitations.myList(),
    queryFn: () => getHiddenInvitations(),
  });
}

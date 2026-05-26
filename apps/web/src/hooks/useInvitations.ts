"use client";

import { useQuery } from "@tanstack/react-query";
import { getInvitation, getMyInvitations } from "@/lib/api/invitations";
import { QUERY_KEYS } from "@/constants/queryKeys";

export function useInvitation(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.invitations.detail(id),
    queryFn: () => getInvitation(id),
    enabled: !!id,
  });
}

export function useMyInvitations() {
  return useQuery({
    queryKey: QUERY_KEYS.invitations.all(),
    queryFn: () => getMyInvitations(),
  });
}

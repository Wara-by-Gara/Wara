"use client";

import { useQuery } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/constants/queryKeys";
import { getParticipants, getMyParticipant } from "@/lib/api/participants";

export function useParticipants(invitationId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.invitations.participants(invitationId),
    queryFn: () =>
      getParticipants(invitationId, localStorage.getItem("access_token") ?? ""),
    enabled: !!invitationId,
  });
}

export function useMyParticipant(invitationId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.invitations.myParticipant(invitationId),
    queryFn: () =>
      getMyParticipant(invitationId, localStorage.getItem("access_token") ?? ""),
    enabled: !!invitationId,
  });
}

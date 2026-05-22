"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/constants/queryKeys";
import { getParticipants, getMyParticipant, joinInvitation, type RsvpStatus } from "@/lib/api/participants";

export function useParticipants(invitationId: string, token?: string) {
  return useQuery({
    queryKey: QUERY_KEYS.invitations.participants(invitationId),
    queryFn: () =>
      getParticipants(invitationId, token ?? localStorage.getItem("access_token") ?? ""),
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

export function useJoinInvitation(invitationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (rsvpStatus: RsvpStatus) =>
      joinInvitation(invitationId, rsvpStatus, localStorage.getItem("access_token") ?? ""),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.invitations.participants(invitationId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.invitations.myParticipant(invitationId) });
    },
  });
}

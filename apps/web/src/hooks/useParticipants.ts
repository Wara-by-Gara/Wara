"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/constants/queryKeys";
import { getParticipants, getMyParticipant, joinInvitation, updateRsvp } from "@/lib/api/participants";
import type { RsvpStatus } from "@/lib/api/participants";

export function useParticipants(invitationId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.invitations.participants(invitationId),
    queryFn: () => getParticipants(invitationId),
    enabled: !!invitationId,
  });
}

export function useMyParticipant(invitationId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: QUERY_KEYS.invitations.myParticipant(invitationId),
    queryFn: () => getMyParticipant(invitationId),
    enabled: (options?.enabled ?? true) && !!invitationId,
  });
}

export function useUpdateRsvp(invitationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ participantId, rsvpStatus }: { participantId: string; rsvpStatus: RsvpStatus }) =>
      updateRsvp(invitationId, participantId, rsvpStatus),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.invitations.participants(invitationId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.invitations.myParticipant(invitationId) });
    },
  });
}

export function useJoinInvitation(invitationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { rsvpStatus: RsvpStatus; note?: string }) =>
      joinInvitation(invitationId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.invitations.participants(invitationId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.invitations.myParticipant(invitationId) });
    },
  });
}

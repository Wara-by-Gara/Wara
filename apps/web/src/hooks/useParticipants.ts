"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/constants/queryKeys";
import { getParticipants, getMyParticipant, joinInvitation, updateRsvp, transferHost, updateHidden } from "@/lib/api/participants";
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

function invalidateParticipantFeedQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  invitationId: string,
) {
  queryClient.invalidateQueries({ queryKey: QUERY_KEYS.invitations.participants(invitationId) });
  queryClient.invalidateQueries({ queryKey: QUERY_KEYS.invitations.myParticipant(invitationId) });
  queryClient.invalidateQueries({ queryKey: QUERY_KEYS.invitations.photos(invitationId) });
  queryClient.invalidateQueries({ queryKey: QUERY_KEYS.invitations.feedbacks(invitationId) });
  queryClient.invalidateQueries({ queryKey: ["myParticipant", invitationId] });
}

export function useUpdateRsvp(invitationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ participantId, rsvpStatus }: { participantId: string; rsvpStatus: RsvpStatus }) =>
      updateRsvp(invitationId, participantId, rsvpStatus),
    onSuccess: (participant) => {
      queryClient.setQueryData(QUERY_KEYS.invitations.myParticipant(invitationId), participant);
      queryClient.setQueryData(["myParticipant", invitationId], participant);
      invalidateParticipantFeedQueries(queryClient, invitationId);
    },
  });
}

export function useJoinInvitation(invitationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { rsvpStatus: RsvpStatus; note?: string }) =>
      joinInvitation(invitationId, payload),
    onSuccess: (participant) => {
      queryClient.setQueryData(QUERY_KEYS.invitations.myParticipant(invitationId), participant);
      queryClient.setQueryData(["myParticipant", invitationId], participant);
      invalidateParticipantFeedQueries(queryClient, invitationId);
    },
  });
}

export function useTransferHost(invitationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (participantId: string) => transferHost(invitationId, participantId),
    onSuccess: () => {
      invalidateParticipantFeedQueries(queryClient, invitationId);
      // 소유자(userId)·내 role 변경 → 상세 호스트/게스트 판정 갱신
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.invitations.detail(invitationId) });
    },
  });
}

export function useHideInvitation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ invitationId, isHidden }: { invitationId: string; isHidden: boolean }) =>
      updateHidden(invitationId, isHidden),
    onSuccess: (_, { invitationId }) => {
      queryClient.setQueryData(QUERY_KEYS.invitations.myParticipant(invitationId), undefined);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.invitations.all() });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.invitations.myList() });
    },
  });
}

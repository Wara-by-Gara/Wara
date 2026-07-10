import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  getMyParticipant,
  getParticipants,
  invitationKeys,
  joinInvitation,
  leaveInvitation,
  participantKeys,
  setCoHost,
  transferHost,
  updateHidden,
  updateHostMemo,
  updateRsvp,
  type RsvpStatus,
} from '@/api';

export function useParticipants(invitationId: string) {
  return useQuery({
    queryKey: participantKeys.list(invitationId),
    queryFn: ({ signal }) => getParticipants(invitationId, { signal }),
    enabled: !!invitationId,
  });
}

export function useMyParticipant(invitationId: string) {
  return useQuery({
    queryKey: participantKeys.me(invitationId),
    queryFn: ({ signal }) => getMyParticipant(invitationId, { signal }),
    enabled: !!invitationId,
  });
}

/** RSVP 변경 후 상세(내 RSVP 상태)·참가자 목록·내 참가자 캐시를 함께 무효화. */
function useRsvpInvalidation(invitationId: string) {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: invitationKeys.detail(invitationId) });
    qc.invalidateQueries({ queryKey: participantKeys.list(invitationId) });
    qc.invalidateQueries({ queryKey: participantKeys.me(invitationId) });
  };
}

export function useJoinInvitation(invitationId: string) {
  const invalidate = useRsvpInvalidation(invitationId);
  return useMutation({
    mutationFn: (payload: { rsvpStatus: RsvpStatus; note?: string }) =>
      joinInvitation(invitationId, payload),
    onSuccess: invalidate,
  });
}

export function useUpdateRsvp(invitationId: string) {
  const invalidate = useRsvpInvalidation(invitationId);
  return useMutation({
    mutationFn: (vars: { participantId: string; rsvpStatus: RsvpStatus }) =>
      updateRsvp(invitationId, vars.participantId, vars.rsvpStatus),
    onSuccess: invalidate,
  });
}

export function useLeaveInvitation(invitationId: string) {
  const invalidate = useRsvpInvalidation(invitationId);
  return useMutation({
    mutationFn: (vars: { participantId: string; reason?: string }) =>
      leaveInvitation(invitationId, vars.participantId, vars.reason),
    onSuccess: invalidate,
  });
}

export function useUpdateHostMemo(invitationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { participantId: string; memo: string | null }) =>
      updateHostMemo(invitationId, vars.participantId, vars.memo),
    onSuccess: () => qc.invalidateQueries({ queryKey: participantKeys.list(invitationId) }),
  });
}

export function useTransferHost(invitationId: string) {
  const invalidate = useRsvpInvalidation(invitationId);
  return useMutation({
    mutationFn: (participantId: string) => transferHost(invitationId, participantId),
    onSuccess: invalidate,
  });
}

export function useSetCoHost(invitationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { participantId: string; isCoHost: boolean }) =>
      setCoHost(invitationId, vars.participantId, vars.isCoHost),
    onSuccess: () => qc.invalidateQueries({ queryKey: participantKeys.list(invitationId) }),
  });
}

export function useUpdateHidden(invitationId: string) {
  const invalidate = useRsvpInvalidation(invitationId);
  return useMutation({
    mutationFn: (isHidden: boolean) => updateHidden(invitationId, isHidden),
    onSuccess: invalidate,
  });
}

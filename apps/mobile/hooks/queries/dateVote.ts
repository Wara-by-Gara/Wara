// 날짜 투표 TanStack Query 훅 — @/api/dateVote 위에 조회/뮤테이션을 래핑.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { invitationKeys } from '@/api';
import {
  addSlot,
  closePoll,
  confirmSlot,
  createPoll,
  dateVoteKeys,
  deleteSlot,
  getPoll,
  getResults,
  listPolls,
  submitResponses,
  type AddSlotBody,
  type CreatePollBody,
  type SubmitResponseInput,
} from '@/api/dateVote';

// ── 조회 ──────────────────────────────────────────────────────────────────────

export function usePolls(invitationId: string) {
  return useQuery({
    queryKey: dateVoteKeys.polls(invitationId),
    queryFn: ({ signal }) => listPolls(invitationId, { signal }),
    enabled: !!invitationId,
  });
}

export function usePoll(invitationId: string, pollId: string | undefined) {
  return useQuery({
    queryKey: dateVoteKeys.poll(invitationId, pollId ?? ''),
    queryFn: ({ signal }) => getPoll(invitationId, pollId as string, { signal }),
    enabled: !!invitationId && !!pollId,
  });
}

export function useResults(invitationId: string, pollId: string | undefined) {
  return useQuery({
    queryKey: dateVoteKeys.results(invitationId, pollId ?? ''),
    queryFn: ({ signal }) => getResults(invitationId, pollId as string, { signal }),
    enabled: !!invitationId && !!pollId,
  });
}

// ── 뮤테이션 ────────────────────────────────────────────────────────────────

/** 단일 폴(상세·결과) 캐시 무효화. */
function useInvalidatePoll(invitationId: string) {
  const qc = useQueryClient();
  return (pollId: string) => {
    qc.invalidateQueries({ queryKey: dateVoteKeys.polls(invitationId) });
    qc.invalidateQueries({ queryKey: dateVoteKeys.poll(invitationId, pollId) });
    qc.invalidateQueries({ queryKey: dateVoteKeys.results(invitationId, pollId) });
  };
}

export function useSubmitResponses(invitationId: string) {
  const invalidate = useInvalidatePoll(invitationId);
  return useMutation({
    mutationFn: (vars: { pollId: string; responses: SubmitResponseInput[] }) =>
      submitResponses(invitationId, vars.pollId, vars.responses),
    onSuccess: (_data, vars) => invalidate(vars.pollId),
  });
}

export function useCreatePoll(invitationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreatePollBody) => createPoll(invitationId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: dateVoteKeys.polls(invitationId) });
      qc.invalidateQueries({ queryKey: invitationKeys.detail(invitationId) });
    },
  });
}

export function useAddSlot(invitationId: string) {
  const invalidate = useInvalidatePoll(invitationId);
  return useMutation({
    mutationFn: (vars: { pollId: string; body: AddSlotBody }) =>
      addSlot(invitationId, vars.pollId, vars.body),
    onSuccess: (_data, vars) => invalidate(vars.pollId),
  });
}

export function useDeleteSlot(invitationId: string) {
  const invalidate = useInvalidatePoll(invitationId);
  return useMutation({
    mutationFn: (vars: { pollId: string; slotId: string }) =>
      deleteSlot(invitationId, vars.pollId, vars.slotId),
    onSuccess: (_data, vars) => invalidate(vars.pollId),
  });
}

export function useClosePoll(invitationId: string) {
  const invalidate = useInvalidatePoll(invitationId);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (pollId: string) => closePoll(invitationId, pollId),
    onSuccess: (_data, pollId) => {
      invalidate(pollId);
      qc.invalidateQueries({ queryKey: invitationKeys.detail(invitationId) });
    },
  });
}

export function useConfirmSlot(invitationId: string) {
  const invalidate = useInvalidatePoll(invitationId);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { pollId: string; slotId: string }) =>
      confirmSlot(invitationId, vars.pollId, vars.slotId),
    onSuccess: (_data, vars) => {
      invalidate(vars.pollId);
      qc.invalidateQueries({ queryKey: invitationKeys.detail(invitationId) });
    },
  });
}

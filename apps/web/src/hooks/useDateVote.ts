"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/constants/queryKeys";
import {
  getPoll,
  getVoteResults,
  createPoll,
  submitResponses,
  closePoll,
  confirmSlot,
} from "@/lib/api/dateVote";
import type { CreatePollBody, ApiVoteResponse } from "@/lib/api/dateVote";
import { isOptionalVotePollError } from "@/lib/api/getApiErrorCode";

// ── Queries ──────────────────────────────────────────────────────────────────

/**
 * 투표 + 내 응답 조회. 투표가 없으면 null 반환 (VOTE_POLL_NOT_FOUND → null).
 */
export function usePoll(invitationId: string, options?: { enabled?: boolean }) {
  const enabled = (options?.enabled ?? true) && !!invitationId;

  return useQuery({
    queryKey: QUERY_KEYS.invitations.vote(invitationId),
    queryFn: async () => {
      try {
        return await getPoll(invitationId);
      } catch (err: unknown) {
        if (isOptionalVotePollError(err)) return null;
        throw err;
      }
    },
    enabled,
    retry: false,
  });
}

/** 슬롯별 집계 결과 조회 (closed / confirmed 상태에서 사용). */
export function useVoteResults(invitationId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: QUERY_KEYS.invitations.voteResults(invitationId),
    queryFn: () => getVoteResults(invitationId),
    enabled: (options?.enabled ?? true) && !!invitationId,
    retry: false,
  });
}

// ── Mutations ────────────────────────────────────────────────────────────────

/** 투표 생성 (HOST 전용). 성공 시 vote 쿼리 무효화. */
export function useCreatePoll(invitationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreatePollBody) => createPoll(invitationId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.invitations.vote(invitationId) });
    },
  });
}

/** 응답 제출 / 수정 (PUT semantics: 기존 응답 전체 교체). */
export function useSubmitResponses(invitationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (responses: { slotId: string; response: ApiVoteResponse }[]) =>
      submitResponses(invitationId, responses),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.invitations.vote(invitationId) });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.invitations.voteResults(invitationId) });
    },
  });
}

/** 투표 조기 종료 (HOST 전용). */
export function useClosePoll(invitationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => closePoll(invitationId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.invitations.vote(invitationId) });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.invitations.voteResults(invitationId) });
    },
  });
}

/** 날짜 확정 (HOST 전용, closed 상태에서만). */
export function useConfirmSlot(invitationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (slotId: string) => confirmSlot(invitationId, slotId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.invitations.vote(invitationId) });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.invitations.voteResults(invitationId) });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.invitations.detail(invitationId) });
    },
  });
}

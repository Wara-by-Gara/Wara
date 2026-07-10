// 날짜 투표 API — 웹 dateVote.ts 포팅.
// ⚠️ 웹 원본은 단일 투표(pollId 없는) 경로를 쓰지만, 실제 백엔드
//    (apps/api/src/date-vote/date-vote.controller.ts)는 pollId 기반 다중 투표 라우트다.
//    모바일은 실제 API에 맞춰 경로/함수를 정정하고, 도메인 타입은 그대로 유지한다.
import { apiFetch, newIdempotencyKey } from '@/api';

// ── 도메인 타입 (API shape) ───────────────────────────────────────────────────

export type VoteType = 'date' | 'custom';
export type PollStatus = 'open' | 'closed' | 'confirmed';
export type VoteResponseType = 'good' | 'maybe' | 'bad';

export interface DateVotePoll {
  id: string;
  invitationId: string;
  voteType: VoteType;
  title: string | null;
  closesAt: string;
  status: PollStatus;
  isAnonymous: boolean;
  confirmedSlotId: string | null;
  reminderSentAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DateVoteSlot {
  id: string;
  pollId: string;
  date: string | null; // 'YYYY-MM-DD' (date 투표), custom이면 null
  startTime: string | null; // 'HH:MM', null = 종일
  label: string | null; // custom 후보 텍스트, date면 null
  sortOrder: number;
  createdAt: string;
}

export interface DateVoteResponse {
  id: string;
  slotId: string;
  participantId: string;
  response: VoteResponseType;
  createdAt: string;
  updatedAt: string;
}

export interface VoterEntry {
  participantId: string;
  displayName: string | null;
  response: VoteResponseType;
}

export interface SlotResult {
  slot: DateVoteSlot;
  counts: { good: number; maybe: number; bad: number };
  voters?: VoterEntry[];
}

export interface PollWithSlots {
  poll: DateVotePoll;
  slots: DateVoteSlot[];
}

// ── 응답 형태 ─────────────────────────────────────────────────────────────────

export interface ListPollsResponse {
  polls: PollWithSlots[];
}

export interface GetPollResponse {
  poll: DateVotePoll;
  slots: DateVoteSlot[];
  myResponses: DateVoteResponse[];
}

export interface GetResultsResponse {
  poll: DateVotePoll;
  slotResults: SlotResult[];
  voterCount: number;
}

// ── 요청 바디 ─────────────────────────────────────────────────────────────────

export interface CreatePollSlotInput {
  date?: string; // 'YYYY-MM-DD'
  startTime?: string; // 'HH:MM'
  label?: string;
  sortOrder?: number;
}

export interface CreatePollBody {
  voteType?: VoteType;
  title?: string;
  closesAt?: string; // ISO 8601, 없으면 서버 기본(먼 미래)
  isAnonymous: boolean;
  slots: CreatePollSlotInput[];
}

export interface AddSlotBody {
  date?: string; // 'YYYY-MM-DD'
  startTime?: string; // 'HH:MM'
  label?: string;
  sortOrder?: number;
}

export interface SubmitResponseInput {
  slotId: string;
  response: VoteResponseType;
}

// ── 조회 ──────────────────────────────────────────────────────────────────────

/** 초대장의 투표 목록(다중 투표). 폴이 없으면 빈 배열. */
export function listPolls(invitationId: string, opts: { signal?: AbortSignal } = {}) {
  return apiFetch<ListPollsResponse>(`/invitations/${invitationId}/vote`, {
    signal: opts.signal,
  });
}

/** 단일 폴 상세 — 슬롯 + 내 응답. */
export function getPoll(
  invitationId: string,
  pollId: string,
  opts: { signal?: AbortSignal } = {},
) {
  return apiFetch<GetPollResponse>(`/invitations/${invitationId}/vote/${pollId}`, {
    signal: opts.signal,
  });
}

/** 슬롯별 집계 결과 — 득표수 + (공개 폴이면) 응답자. */
export function getResults(
  invitationId: string,
  pollId: string,
  opts: { signal?: AbortSignal } = {},
) {
  return apiFetch<GetResultsResponse>(
    `/invitations/${invitationId}/vote/${pollId}/results`,
    { signal: opts.signal },
  );
}

// ── 투표(선택/해제) ───────────────────────────────────────────────────────────

/** PUT semantics — 전달한 응답 집합으로 내 응답 전체를 치환한다(빈 배열=전체 해제). */
export function submitResponses(
  invitationId: string,
  pollId: string,
  responses: SubmitResponseInput[],
) {
  return apiFetch<DateVoteResponse[]>(
    `/invitations/${invitationId}/vote/${pollId}/responses`,
    { method: 'PUT', body: { responses } },
  );
}

// ── 호스트: 폴 생성 / 슬롯 추가·삭제 / 마감 / 확정 ────────────────────────────

export function createPoll(invitationId: string, body: CreatePollBody) {
  return apiFetch<PollWithSlots>(`/invitations/${invitationId}/vote`, {
    method: 'POST',
    body,
    idempotencyKey: newIdempotencyKey(),
  });
}

export function addSlot(invitationId: string, pollId: string, body: AddSlotBody) {
  return apiFetch<DateVoteSlot>(`/invitations/${invitationId}/vote/${pollId}/slots`, {
    method: 'POST',
    body,
    idempotencyKey: newIdempotencyKey(),
  });
}

export function deleteSlot(invitationId: string, pollId: string, slotId: string) {
  return apiFetch<void>(
    `/invitations/${invitationId}/vote/${pollId}/slots/${slotId}`,
    { method: 'DELETE' },
  );
}

export function closePoll(invitationId: string, pollId: string) {
  return apiFetch<DateVotePoll>(`/invitations/${invitationId}/vote/${pollId}/close`, {
    method: 'POST',
    idempotencyKey: newIdempotencyKey(),
  });
}

/** 확정 — 공동 1등일 때 호스트가 슬롯을 골라 확정. date 투표면 초대장 날짜도 세팅됨. */
export function confirmSlot(invitationId: string, pollId: string, slotId: string) {
  return apiFetch<DateVotePoll>(`/invitations/${invitationId}/vote/${pollId}/confirm`, {
    method: 'POST',
    body: { slotId },
    idempotencyKey: newIdempotencyKey(),
  });
}

// ── Query keys ────────────────────────────────────────────────────────────────

export const dateVoteKeys = {
  all: ['dateVote'] as const,
  polls: (invitationId: string) => ['dateVote', 'polls', invitationId] as const,
  poll: (invitationId: string, pollId: string) =>
    ['dateVote', 'poll', invitationId, pollId] as const,
  results: (invitationId: string, pollId: string) =>
    ['dateVote', 'results', invitationId, pollId] as const,
};

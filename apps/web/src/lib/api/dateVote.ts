import { apiGet, apiPost, apiPut } from './client';

// ── Domain types (API shape) ─────────────────────────────────────────────────

export interface DateVotePoll {
  id: string;
  invitationId: string;
  closesAt: string;
  status: 'open' | 'closed' | 'confirmed';
  isAnonymous: boolean;
  confirmedSlotId: string | null;
  reminderSentAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DateVoteSlot {
  id: string;
  pollId: string;
  date: string;       // YYYY-MM-DD
  startTime: string | null; // HH:MM
  sortOrder: number;
  createdAt: string;
}

export interface DateVoteResponse {
  id: string;
  slotId: string;
  participantId: string;
  response: 'good' | 'maybe' | 'bad';
  createdAt: string;
  updatedAt: string;
}

export interface VoterEntry {
  participantId: string;
  displayName: string | null;
  response: 'good' | 'maybe' | 'bad';
}

export interface SlotResult {
  slot: DateVoteSlot;
  counts: { good: number; maybe: number; bad: number };
  voters?: VoterEntry[];
}

// ── Response shapes ──────────────────────────────────────────────────────────

export interface GetPollResponse {
  poll: DateVotePoll;
  slots: DateVoteSlot[];
  myResponses: DateVoteResponse[];
}

export interface GetResultsResponse {
  poll: DateVotePoll;
  slotResults: SlotResult[];
}

// ── Request bodies ───────────────────────────────────────────────────────────

export interface CreatePollBody {
  closesAt: string; // ISO 8601
  isAnonymous: boolean;
  slots: { date: string; startTime?: string; sortOrder?: number }[];
}

export type ApiVoteResponse = 'good' | 'maybe' | 'bad';

// ── API functions ────────────────────────────────────────────────────────────

export function getPoll(invitationId: string): Promise<GetPollResponse> {
  return apiGet<GetPollResponse>(`/invitations/${invitationId}/vote`);
}

export function getVoteResults(invitationId: string): Promise<GetResultsResponse> {
  return apiGet<GetResultsResponse>(`/invitations/${invitationId}/vote/results`);
}

export function createPoll(
  invitationId: string,
  body: CreatePollBody,
): Promise<{ poll: DateVotePoll; slots: DateVoteSlot[] }> {
  return apiPost(`/invitations/${invitationId}/vote`, body);
}

export function submitResponses(
  invitationId: string,
  responses: { slotId: string; response: ApiVoteResponse }[],
): Promise<DateVoteResponse[]> {
  return apiPut<DateVoteResponse[]>(`/invitations/${invitationId}/vote/responses`, { responses });
}

export function closePoll(invitationId: string): Promise<DateVotePoll> {
  return apiPost<DateVotePoll>(`/invitations/${invitationId}/vote/close`);
}

export function confirmSlot(invitationId: string, slotId: string): Promise<DateVotePoll> {
  return apiPost<DateVotePoll>(`/invitations/${invitationId}/vote/confirm`, { slotId });
}

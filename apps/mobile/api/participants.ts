import { apiFetch, newIdempotencyKey } from './client';
import { WaraApiError } from './types';

export type RsvpStatus = 'attending' | 'undecided' | 'absent';
export type MemberRole = 'HOST' | 'GUEST';

export type ParticipantUser = {
  id: string;
  name: string | null;
  nickname: string | null;
  profileImageUrl: string | null;
};

export type Participant = {
  id: string;
  userId: string;
  invitationId: string;
  memberRole: MemberRole;
  rsvpStatus: RsvpStatus;
  isHidden: boolean;
  createdAt: string;
  note: string | null;
  hostMemo: string | null;
  user?: ParticipantUser;
};

export type ParticipantsResponse = {
  summary: {
    totalCount: number;
    attendingCount: number;
    undecidedCount: number;
    absentCount: number;
  };
  participants: {
    participant: Participant;
    user: ParticipantUser;
  }[];
};

// ── 조회 ────────────────────────────────────────────────────────────────────

export function getParticipants(invitationId: string, opts: { signal?: AbortSignal } = {}) {
  return apiFetch<ParticipantsResponse>(`/invitations/${invitationId}/participants`, {
    signal: opts.signal,
  });
}

/** 내 참가자 정보. absent 상태 등으로 열람 불가(RSVP_PERMISSION_DENIED) 시 null. */
export async function getMyParticipant(
  invitationId: string,
  opts: { signal?: AbortSignal } = {},
): Promise<Participant | null> {
  try {
    const r = await apiFetch<{ participant: Participant }>(
      `/invitations/${invitationId}/participants/me`,
      { signal: opts.signal },
    );
    return r.participant;
  } catch (err) {
    if (err instanceof WaraApiError && err.code === 'RSVP_PERMISSION_DENIED') return null;
    throw err;
  }
}

// ── 변경 ────────────────────────────────────────────────────────────────────

export function joinInvitation(
  invitationId: string,
  payload: { rsvpStatus: RsvpStatus; note?: string },
) {
  return apiFetch<Participant>(`/invitations/${invitationId}/participants`, {
    method: 'POST',
    body: payload,
    idempotencyKey: newIdempotencyKey(),
  });
}

export function updateRsvp(invitationId: string, participantId: string, rsvpStatus: RsvpStatus) {
  return apiFetch<Participant>(
    `/invitations/${invitationId}/participants/${participantId}/rsvp`,
    { method: 'PATCH', body: { rsvpStatus } },
  );
}

export function leaveInvitation(invitationId: string, participantId: string, reason?: string) {
  return apiFetch<void>(`/invitations/${invitationId}/participants/${participantId}`, {
    method: 'DELETE',
    body: reason ? { reason } : undefined,
  });
}

export function updateHostMemo(invitationId: string, participantId: string, memo: string | null) {
  return apiFetch<Participant>(
    `/invitations/${invitationId}/participants/${participantId}/host-memo`,
    { method: 'PATCH', body: { memo } },
  );
}

export function transferHost(invitationId: string, participantId: string) {
  return apiFetch<void>(
    `/invitations/${invitationId}/participants/${participantId}/transfer-host`,
    { method: 'PATCH', body: {} },
  );
}

/** 공동 호스트 지정(true)/해제(false). */
export function setCoHost(invitationId: string, participantId: string, isCoHost: boolean) {
  return apiFetch<void>(
    `/invitations/${invitationId}/participants/${participantId}/co-host`,
    { method: 'PATCH', body: { isCoHost } },
  );
}

export function updateHidden(invitationId: string, isHidden: boolean) {
  return apiFetch<Participant>(`/invitations/${invitationId}/participants/me/hidden`, {
    method: 'PATCH',
    body: { isHidden },
  });
}

// ── Query keys ───────────────────────────────────────────────────────────────
export const participantKeys = {
  all: ['participants'] as const,
  list: (invitationId: string) => ['participants', 'list', invitationId] as const,
  me: (invitationId: string) => ['participants', 'me', invitationId] as const,
};

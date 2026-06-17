import { apiGet, apiPost, apiPatch, apiDelete } from "./client";


export type RsvpStatus = "attending" | "undecided" | "absent";
export type MemberRole = "HOST" | "GUEST";

export interface Participant {
  id: string;
  userId: string;
  invitationId: string;
  memberRole: MemberRole;
  rsvpStatus: RsvpStatus;
  isHidden: boolean;
  createdAt: string;
  note: string | null;
  hostMemo: string | null;
  user?: {
    id: string;
    name: string | null;
    nickname: string | null;
    profileImageUrl: string | null;
  };
}

export interface ParticipantsResponse {
  summary: {
    totalCount: number;
    attendingCount: number;
    undecidedCount: number;
    absentCount: number;
  };
  participants: {
    participant: Participant;
    user: { id: string; name: string | null; nickname: string | null; profileImageUrl: string | null };
  }[];
}

export function getParticipants(invitationId: string): Promise<ParticipantsResponse> {
  return apiGet<ParticipantsResponse>(`/invitations/${invitationId}/participants`);
}

export function getMyParticipant(invitationId: string): Promise<Participant | null> {
  return apiGet<{ participant: Participant }>(`/invitations/${invitationId}/participants/me`)
    .then((r) => r.participant)
    .catch((err: { error?: { code?: string } }) => {
      if (err?.error?.code === "RSVP_PERMISSION_DENIED") return null;
      throw err;
    });
}

export function joinInvitation(
  invitationId: string,
  payload: { rsvpStatus: RsvpStatus; note?: string },
): Promise<Participant> {
  return apiPost<Participant>(`/invitations/${invitationId}/participants`, payload);
}

export function updateRsvp(invitationId: string, participantId: string, rsvpStatus: RsvpStatus): Promise<Participant> {
  return apiPatch<Participant>(`/invitations/${invitationId}/participants/${participantId}/rsvp`, { rsvpStatus });
}

export function leaveInvitation(invitationId: string, participantId: string): Promise<void> {
  return apiDelete(`/invitations/${invitationId}/participants/${participantId}`);
}

export function updateHostMemo(invitationId: string, participantId: string, memo: string | null): Promise<Participant> {
  return apiPatch<Participant>(`/invitations/${invitationId}/participants/${participantId}/host-memo`, { memo });
}

export function transferHost(invitationId: string, participantId: string): Promise<void> {
  return apiPatch<void>(`/invitations/${invitationId}/participants/${participantId}/transfer-host`, {});
}

/** 공동 호스트 지정(true)/해제(false) */
export function setCoHost(invitationId: string, participantId: string, isCoHost: boolean): Promise<void> {
  return apiPatch<void>(`/invitations/${invitationId}/participants/${participantId}/co-host`, { isCoHost });
}

export function updateHidden(invitationId: string, isHidden: boolean): Promise<Participant> {
  return apiPatch<Participant>(`/invitations/${invitationId}/participants/me/hidden`, { isHidden });
}

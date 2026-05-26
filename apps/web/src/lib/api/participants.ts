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
  displayName: string | null;
  createdAt: string;
  note: string | null;
  hostMemo: string | null;
  user?: {
    id: string;
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
    user: { id: string; nickname: string | null; profileImageUrl: string | null };
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
  payload: { rsvpStatus: RsvpStatus; displayName?: string; note?: string },
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

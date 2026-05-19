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
  participants: { participant: Participant }[];
}

export function getParticipants(invitationId: string, token: string): Promise<ParticipantsResponse> {
  return apiGet<ParticipantsResponse>(`/invitations/${invitationId}/participants`, token);
}

export function joinInvitation(invitationId: string, rsvpStatus: RsvpStatus, token: string): Promise<Participant> {
  return apiPost<Participant>(`/invitations/${invitationId}/participants`, { rsvpStatus }, token);
}

export function updateRsvp(invitationId: string, participantId: string, rsvpStatus: RsvpStatus, token: string): Promise<Participant> {
  return apiPatch<Participant>(`/invitations/${invitationId}/participants/${participantId}/rsvp`, { rsvpStatus }, token);
}

export function leaveInvitation(invitationId: string, participantId: string, token: string): Promise<void> {
  return apiDelete(`/invitations/${invitationId}/participants/${participantId}`, token);
}

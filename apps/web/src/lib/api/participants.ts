import { apiGet, apiPost, apiPatch } from "./client";

export type RsvpStatus = "attending" | "undecided" | "absent" | "cancelled";
export type MemberRole = "HOST" | "GUEST";

export interface Participant {
  id: string;
  userId: string;
  invitationId: string;
  memberRole: MemberRole;
  rsvpStatus: RsvpStatus;
  user?: {
    id: string;
    nickname: string | null;
    profileImageUrl: string | null;
  };
}

export function getParticipants(invitationId: string, token: string): Promise<Participant[]> {
  return apiGet<Participant[]>(`/invitations/${invitationId}/participants`, token);
}

export function joinInvitation(invitationId: string, token: string): Promise<Participant> {
  return apiPost<Participant>(`/invitations/${invitationId}/participants`, {}, token);
}

export function updateRsvp(invitationId: string, participantId: string, rsvpStatus: RsvpStatus, token: string): Promise<Participant> {
  return apiPatch<Participant>(`/invitations/${invitationId}/participants/${participantId}/rsvp`, { rsvpStatus }, token);
}

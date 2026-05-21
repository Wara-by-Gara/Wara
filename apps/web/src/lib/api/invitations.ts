import { apiGet, apiPost } from "./client";

interface CreateInvitationPayload {
  title: string;
  description: string;
  mainImageKey: string;
  templateId?: string;
  eventStartAt?: string;
  isMissionEnabled?: boolean;
}

export interface CreatedInvitation {
  id: string;
  title: string;
  description: string;
  mainImageUrl: string;
  eventStartAt: string | null;
}

export interface Invitation {
  id: string;
  userId: string;
  templateId: string | null;
  status: string;
  title: string;
  description: string;
  mainImageKey: string;
  eventStartAt: string | null;
  isMissionEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export function createInvitation(payload: CreateInvitationPayload, token: string): Promise<CreatedInvitation> {
  return apiPost<CreatedInvitation>("/invitations", payload, token);
}

export function getInvitation(id: string): Promise<Invitation> {
  return apiGet<Invitation>(`/invitations/${id}`);
}

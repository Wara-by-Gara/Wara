import { apiPost } from "./client";

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
}

export function createInvitation(payload: CreateInvitationPayload, token: string): Promise<CreatedInvitation> {
  return apiPost<CreatedInvitation>("/invitations", payload, token);
}

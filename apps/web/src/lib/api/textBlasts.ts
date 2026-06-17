import { apiDelete, apiGet, apiPost } from "./client";

export interface TextBlast {
  id: string;
  invitationId: string;
  message: string;
  recipientCount: number;
  createdAt: string;
}

export function getTextBlasts(invitationId: string): Promise<TextBlast[]> {
  return apiGet<TextBlast[]>(`/invitations/${invitationId}/text-blasts`);
}

export function createTextBlast(
  invitationId: string,
  message: string,
  idempotencyKey: string,
): Promise<TextBlast> {
  return apiPost<TextBlast>(
    `/invitations/${invitationId}/text-blasts`,
    { message },
    { idempotencyKey },
  );
}

export function deleteTextBlast(
  invitationId: string,
  id: string,
): Promise<void> {
  return apiDelete(`/invitations/${invitationId}/text-blasts/${id}`);
}

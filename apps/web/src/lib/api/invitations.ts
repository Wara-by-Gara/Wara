import { apiGet, apiPost, apiPatch } from "./client";

interface CreateInvitationPayload {
  title: string;
  description: string;
  mainImageKey: string;
  templateId?: string;
  eventStartAt?: string;
  isMissionEnabled?: boolean;
}

export type MainImageFrame = 'default' | 'upload' | 'ai';

interface UpdateInvitationPayload {
  title?: string;
  description?: string;
  mainImageKey?: string;
  mainImageFrame?: MainImageFrame;
  uploadedImageKey?: string | null;
  templateId?: string | null;
  eventStartAt?: string | null;
  isMissionEnabled?: boolean;
  status?: 'active' | 'closed';
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
  mainImageFrame: MainImageFrame;
  uploadedImageKey: string | null;
  mainImageUrl: string;
  templatePreviewUrl: string | null;
  eventStartAt: string | null;
  isMissionEnabled: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  eventLocation: EventLocation | null;
}

export interface EventLocation {
  id: string;
  invitationId: string;
  address: string;
  placeName: string;
  detailAddress: string;
  lat: number;
  lng: number;
  placeId: string;
  createdAt: string;
  updatedAt: string;
}

export function createInvitation(payload: CreateInvitationPayload): Promise<CreatedInvitation> {
  return apiPost<CreatedInvitation>("/invitations", payload);
}

export function getInvitation(id: string): Promise<Invitation> {
  return apiGet<Invitation>(`/invitations/${id}`);
}

export function updateInvitation(id: string, payload: UpdateInvitationPayload): Promise<Invitation> {
  return apiPatch<Invitation>(`/invitations/${id}`, payload);
}

export function getMainImagePresignedUrl(
  fileName: string,
  contentType: string,
): Promise<{ presignedUrl: string; key: string }> {
  return apiPost<{ presignedUrl: string; key: string }>('/invitations/presigned-url', {
    fileName,
    contentType,
  });
}

export function applyAiToMainImage(
  invitationId: string,
  imageKey: string,
): Promise<{ key: string; url: string }> {
  return apiPost<{ key: string; url: string }>(
    `/invitations/${invitationId}/main-image/ai`,
    { imageKey },
  );
}

import { apiGet, apiPost, apiPatch } from "./client";

interface CreateInvitationPayload {
  title: string;
  description: string;
  mainImageKey: string;
  templateId?: string;
  eventStartAt?: string;
  isMissionEnabled?: boolean;
  bgColor?: string;
  font?: string;
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
  status: "active" | "closed";
  title: string;
  description: string;
  mainImageKey: string;
  mainImageFrame: MainImageFrame;
  uploadedImageKey: string | null;
  mainImageUrl: string;
  uploadedImageUrl: string | null;
  templatePreviewUrl: string | null;
  eventStartAt: string | null;
  isMissionEnabled: boolean;
  bgColor: string;
  font: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  eventLocation: EventLocation | null;
  myRole?: "HOST" | "GUEST";
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
): Promise<{ jobId: string }> {
  return apiPost<{ jobId: string }>(
    `/invitations/${invitationId}/main-image/ai`,
    { imageKey },
  );
}

export interface AiJobStatusResponse {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  resultKey: string | null;
  resultUrl: string | null;
  errorCode: string | null;
  createdAt: string;
  completedAt: string | null;
}

export function getAiJobStatus(
  invitationId: string,
  jobId: string,
): Promise<AiJobStatusResponse> {
  return apiGet<AiJobStatusResponse>(
    `/invitations/${invitationId}/main-image/ai/jobs/${jobId}`,
  );
}

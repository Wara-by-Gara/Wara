import { apiGet, apiPost, apiPatch, apiDelete } from "./client";

type ImageContentType = "image/jpeg" | "image/png" | "image/webp" | "image/heic" | "image/heif";

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
  uploadedImageUrl: string | null;
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

export function getMyInvitations(): Promise<Invitation[]> {
  return apiGet<Invitation[]>("/invitations");
}

export function updateInvitation(id: string, payload: UpdateInvitationPayload): Promise<Invitation> {
  return apiPatch<Invitation>(`/invitations/${id}`, payload);
}

export function updateInvitationStatus(id: string, status: 'active' | 'closed'): Promise<Invitation> {
  return apiPatch<Invitation>(`/invitations/${id}`, { status });
}

export function deleteInvitation(id: string): Promise<void> {
  return apiDelete(`/invitations/${id}`);
}

export function getInvitationImagePresignedUrl(
  fileName: string,
  contentType: ImageContentType,
): Promise<{ presignedUrl: string; key: string }> {
  return apiPost<{ presignedUrl: string; key: string }>('/invitations/presigned-url', {
    fileName,
    contentType,
  });
}

export async function uploadImageToS3(presignedUrl: string, file: File): Promise<void> {
  const res = await fetch(presignedUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
  });
  if (!res.ok) throw new Error('이미지 업로드에 실패했어요');
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

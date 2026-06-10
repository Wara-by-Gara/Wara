import { apiGet, apiPost, apiPatch, apiDelete } from "./client";

export type MainImageFrame = 'default' | 'upload' | 'ai';

type ImageContentType = "image/jpeg" | "image/png" | "image/webp" | "image/heic" | "image/heif";

export async function getInvitationImagePresignedUrl(
  fileName: string,
  contentType: ImageContentType,
): Promise<{ presignedUrl: string; key: string }> {
  return apiPost<{ presignedUrl: string; key: string }>(
    "/invitations/presigned-url",
    { fileName, contentType },
  );
}

export async function uploadImageToS3(presignedUrl: string, file: File): Promise<void> {
  const res = await fetch(presignedUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });
  if (!res.ok) throw new Error("이미지 업로드에 실패했어요");
}

interface CreateInvitationPayload {
  title: string;
  description: string;
  mainImageKey?: string;
  mainGifUrl?: string;
  templateId?: string;
  eventStartAt?: string;
  isMissionEnabled?: boolean;
  bgColor?: string;
  font?: string;
  animation?: string;
  rsvpAttendingEmoji?: string;
  rsvpAttendingLabel?: string;
  rsvpMaybeEmoji?: string;
  rsvpMaybeLabel?: string;
  rsvpDeclinedEmoji?: string;
  rsvpDeclinedLabel?: string;
}

interface UpdateInvitationPayload {
  title?: string;
  description?: string;
  mainImageKey?: string;
  mainGifUrl?: string;
  mainImageFrame?: MainImageFrame;
  uploadedImageKey?: string | null;
  templateId?: string | null;
  eventStartAt?: string | null;
  isMissionEnabled?: boolean;
  status?: 'active' | 'closed';
  bgColor?: string;
  font?: string;
  animation?: string;
  rsvpAttendingEmoji?: string;
  rsvpAttendingLabel?: string;
  rsvpMaybeEmoji?: string;
  rsvpMaybeLabel?: string;
  rsvpDeclinedEmoji?: string;
  rsvpDeclinedLabel?: string;
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
  mainCoverType: "image" | "gif";
  mainImageKey: string | null;
  mainGifUrl?: string | null;
  mainImageUrl: string | null;
  eventStartAt: string | null;
  isMissionEnabled: boolean;
  bgColor: string;
  font: string;
  animation?: string;
  rsvpAttendingEmoji: string;
  rsvpAttendingLabel: string;
  rsvpMaybeEmoji: string;
  rsvpMaybeLabel: string;
  rsvpDeclinedEmoji: string;
  rsvpDeclinedLabel: string;
  myRole?: 'HOST' | 'GUEST';
  host?: { name: string | null; nickname: string | null; profileImageUrl: string | null } | null;
  participantAvatars?: InvitationParticipantAvatar[];
  participantTotal?: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  eventLocation: EventLocation | null;
}

export interface InvitationParticipantAvatar {
  id: string;
  name: string | null;
  avatarUrl: string | null;
  isHost: boolean;
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

export interface PublicInvitationExplore {
  id: string;
  title: string;
  description: string;
  category: string;
  eventStartAt: string | null;
  mainImageUrl: string | null;
  location: string | null;
  participantCount: number;
  host: {
    name: string | null;
    nickname: string | null;
    profileImageUrl: string | null;
  } | null;
}

export interface PublicInvitationsPage {
  items: PublicInvitationExplore[];
  nextCursor: string | null;
  hasNext: boolean;
}

export function getPublicInvitations(params?: {
  category?: string;
  limit?: number;
  cursor?: string;
}): Promise<PublicInvitationsPage> {
  const search = new URLSearchParams();
  if (params?.category) search.set("category", params.category);
  if (params?.limit != null) search.set("limit", String(params.limit));
  if (params?.cursor) search.set("cursor", params.cursor);
  const qs = search.toString();
  return apiGet<PublicInvitationsPage>(
    qs ? `/invitations/explore?${qs}` : "/invitations/explore",
  );
}

export function updateInvitation(id: string, payload: UpdateInvitationPayload): Promise<Invitation> {
  return apiPatch<Invitation>(`/invitations/${id}`, payload);
}

export function updateInvitationStatus(id: string, status: "active" | "closed"): Promise<Invitation> {
  return apiPatch<Invitation>(`/invitations/${id}`, { status });
}

export function deleteInvitation(id: string): Promise<void> {
  return apiDelete(`/invitations/${id}`);
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

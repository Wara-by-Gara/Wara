import { apiGet, apiPost } from "./client";

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
  mainImageKey: string;
  templateId?: string;
  eventStartAt?: string;
  isMissionEnabled?: boolean;
}

export interface CreatedInvitation {
  id: string;
  title: string;
}

export interface Invitation {
  id: string;
  userId: string;
  templateId: string | null;
  status: string;
  title: string;
  description: string;
  mainImageKey: string;
  mainImageUrl: string;
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

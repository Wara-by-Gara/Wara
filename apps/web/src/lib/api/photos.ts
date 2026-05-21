import { apiGet } from "./client";

export interface Photo {
  id: string;
  participantId: string;
  invitationId: string;
  imageKey: string;
  likeCount: number;
  feedbackCount: number;
  url: string;
  createdAt: string;
}

export interface PhotoListResponse {
  rows: Photo[];
  nextCursor: string | null;
  total: number;
}

export function getPhotos(
  invitationId: string,
  token: string,
  cursor?: string,
  limit = 8,
): Promise<PhotoListResponse> {
  const params = new URLSearchParams({ limit: String(limit) });
  if (cursor) params.set("cursor", cursor);
  return apiGet<PhotoListResponse>(`/invitations/${invitationId}/photos?${params}`, token);
}

export function getPhoto(invitationId: string, photoId: string, token: string): Promise<Photo> {
  return apiGet<Photo>(`/invitations/${invitationId}/photos/${photoId}`, token);
}
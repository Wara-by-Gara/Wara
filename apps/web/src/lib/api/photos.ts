import { apiGet, apiPost } from './client';

export interface Photo {
  id: string;
  participantId: string;
  invitationId: string;
  imageKey: string;
  likeCount: number;
  feedbackCount: number;
  url: string;
  createdAt: string;
  liked?: boolean;
}

export interface PhotoListResponse {
  rows: Photo[];
  nextCursor: string | null;
  total: number;
}

export function getPhotos(
  invitationId: string,
  cursor?: string,
  limit = 8,
): Promise<PhotoListResponse> {
  const params = new URLSearchParams({ limit: String(limit) });
  if (cursor) params.set('cursor', cursor);
  return apiGet<PhotoListResponse>(
    `/invitations/${invitationId}/photos?${params}`,
  );
}

export function getPhoto(
  invitationId: string,
  photoId: string,
): Promise<Photo> {
  return apiGet<Photo>(`/invitations/${invitationId}/photos/${photoId}`);
}

export interface PhotoDownloadItem {
  id: string;
  url: string;
}

export function getDownloadUrls(
  invitationId: string,
  ids: string[],
): Promise<PhotoDownloadItem[]> {
  return apiGet<PhotoDownloadItem[]>(
    `/invitations/${invitationId}/photos/download?ids=${ids.join(',')}`,
  );
}

export function getAllDownloadUrls(
  invitationId: string,
): Promise<PhotoDownloadItem[]> {
  return apiGet<PhotoDownloadItem[]>(
    `/invitations/${invitationId}/photos/download/all`,
  );
}

export interface PresignedUrlResponse {
  presignedUrl: string;
  key: string;
}

export function getPresignedUrl(
  invitationId: string,
  fileName: string,
  contentType: string,
): Promise<PresignedUrlResponse> {
  return apiPost<PresignedUrlResponse>(
    `/invitations/${invitationId}/photos/presigned-url`,
    { fileName, contentType },
  );
}

export function registerPhoto(
  invitationId: string,
  imageKey: string,
): Promise<Photo> {
  return apiPost<Photo>(`/invitations/${invitationId}/photos`, { imageKey });
}

export function togglePhotoLike(
  invitationId: string,
  photoId: string,
): Promise<{ liked: boolean }> {
  return apiPost<{ liked: boolean }>(
    `/invitations/${invitationId}/photos/${photoId}/likes`,
    {},
  );
}

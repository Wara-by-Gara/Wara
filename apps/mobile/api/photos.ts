// 모임 사진(앨범) API — 웹 apps/web/src/lib/api/photos.ts 포팅.
// 업로드/presigned-url/다운로드는 범위 제외(expo-image-picker 미설치). 조회·좋아요·베스트·삭제만.
import { apiFetch, newIdempotencyKey } from './client';

export interface MobilePhoto {
  id: string;
  participantId: string;
  invitationId: string;
  imageKey: string;
  likeCount: number;
  feedbackCount: number;
  url: string;
  createdAt: string;
  takenAt: string | null;
  /** 촬영 위치(EXIF). 목록 응답엔 없을 수 있어 optional. */
  exifMetadata?: {
    gps_lat?: number | null;
    gps_lng?: number | null;
    gps_address?: string | null;
  } | null;
  /** 내가 좋아요했는지 여부. */
  liked?: boolean;
}

export interface MobilePhotoLocation extends MobilePhoto {
  gpsLat: number;
  gpsLng: number;
}

export function fetchMyPhotoLocations(opts: { signal?: AbortSignal } = {}) {
  return apiFetch<MobilePhotoLocation[]>('/photos/locations', { signal: opts.signal });
}

// ── 초대장별 사진 목록 (cursor 페이지네이션) ────────────────────────────────────
// 서버는 { rows, nextCursor, limit, total }를 envelope의 data로 반환(웹과 정합).

export interface PhotoListResponse {
  rows: MobilePhoto[];
  nextCursor: string | null;
  limit?: number;
  total: number;
}

export function fetchInvitationPhotos(
  invitationId: string,
  opts: { cursor?: string; limit?: number; signal?: AbortSignal } = {},
) {
  const params = new URLSearchParams({ limit: String(opts.limit ?? 20) });
  if (opts.cursor) params.set('cursor', opts.cursor);
  return apiFetch<PhotoListResponse>(
    `/invitations/${invitationId}/photos?${params.toString()}`,
    { signal: opts.signal },
  );
}

export function fetchPhoto(
  invitationId: string,
  photoId: string,
  opts: { signal?: AbortSignal } = {},
) {
  return apiFetch<MobilePhoto>(`/invitations/${invitationId}/photos/${photoId}`, {
    signal: opts.signal,
  });
}

// ── 리마인드 앨범(Best 9) ──────────────────────────────────────────────────────

export interface Best9Photo extends MobilePhoto {
  score: number;
}

export function fetchBest9(invitationId: string, opts: { signal?: AbortSignal } = {}) {
  return apiFetch<Best9Photo[]>(`/invitations/${invitationId}/photos/best9`, {
    signal: opts.signal,
  });
}

// ── 변경 ────────────────────────────────────────────────────────────────────

/** 좋아요 토글. keepalive로 화면 이탈 중에도 전송 보장(웹과 동일 의도). */
export function togglePhotoLike(invitationId: string, photoId: string) {
  return apiFetch<{ liked: boolean; likeCount: number }>(
    `/invitations/${invitationId}/photos/${photoId}/likes`,
    { method: 'POST', body: {}, keepalive: true },
  );
}

/** 사진 삭제(soft delete). 204 No Content. */
export function deletePhoto(invitationId: string, photoId: string) {
  return apiFetch<void>(`/invitations/${invitationId}/photos/${photoId}`, {
    method: 'DELETE',
    idempotencyKey: newIdempotencyKey(),
  });
}

// ── 업로드 (presigned URL → S3 PUT → 등록) ──────────────────────────────────────
// 웹 apps/web/src/lib/api/photos.ts의 getPresignedUrl/registerPhoto 포팅.
// 실제 S3 PUT은 hooks/useImageUpload에서 수행한다(여긴 WARA API 계약만 담당).

export interface PhotoPresignedUrlResponse {
  presignedUrl: string;
  key: string;
}

/** POST /invitations/:id/photos/presigned-url — 앨범 사진 업로드용 presigned URL 발급. */
export function getPhotoPresignedUrl(
  invitationId: string,
  fileName: string,
  contentType: string,
) {
  return apiFetch<PhotoPresignedUrlResponse>(
    `/invitations/${invitationId}/photos/presigned-url`,
    { method: 'POST', body: { fileName, contentType } },
  );
}

export interface RegisterPhotoMeta {
  takenAt?: string;
  fileSize?: number;
  exifMetadata?: {
    gps_lat?: number;
    gps_lng?: number;
    make?: string;
    model?: string;
  };
}

/** POST /invitations/:id/photos — S3 업로드 완료 후 메타(촬영시각/GPS/기기) 등록. */
export function registerPhoto(
  invitationId: string,
  imageKey: string,
  meta: RegisterPhotoMeta = {},
) {
  return apiFetch<MobilePhoto>(`/invitations/${invitationId}/photos`, {
    method: 'POST',
    body: { imageKey, ...meta },
    idempotencyKey: newIdempotencyKey(),
  });
}

// ── Query keys ───────────────────────────────────────────────────────────────
export const photoKeys = {
  all: ['photos'] as const,
  myLocations: ['photos', 'locations'] as const,
  list: (invitationId: string) => ['photos', 'list', invitationId] as const,
  detail: (invitationId: string, photoId: string) =>
    ['photos', 'detail', invitationId, photoId] as const,
  best9: (invitationId: string) => ['photos', 'best9', invitationId] as const,
};

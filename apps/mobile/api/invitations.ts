import { apiFetch, newIdempotencyKey } from './client';

// 와라 API의 Invitation 응답 형태 (apps/api/src/database/schema/invitations.ts).
// JSON 직렬화로 모든 timestamp는 ISO 문자열. 웹 apps/web/src/lib/api/invitations.ts와 정합.

export type ImageContentType = 'image/jpeg' | 'image/png' | 'image/webp' | 'image/heic' | 'image/heif';
export type MainImageFrame = 'default' | 'upload' | 'ai';

export type InvitationEventLocation = {
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
};

export type InvitationParticipantAvatar = {
  id: string;
  name: string | null;
  avatarUrl: string | null;
  isHost: boolean;
};

/** 상세 조회(GET /invitations/:id) 응답 — 내 역할/RSVP 포함. */
export type Invitation = {
  id: string;
  userId: string;
  templateId: string | null;
  status: 'active' | 'closed';
  title: string;
  description: string;
  mainCoverType: 'image' | 'gif';
  mainImageKey: string | null;
  mainGifUrl?: string | null;
  mainImageUrl: string | null;
  mainImageThumbnailUrl: string | null;
  eventStartAt: string | null;
  rsvpDeadlineAt: string | null;
  hasPassword: boolean;
  isPublic: boolean;
  isMissionEnabled: boolean;
  category?: string | null;
  fee?: string | null;
  dressCode?: string | null;
  parkingInfo?: string | null;
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
  myRsvpStatus?: 'attending' | 'undecided' | 'absent' | null;
  host?: { name: string | null; nickname: string | null; profileImageUrl: string | null } | null;
  participantAvatars?: InvitationParticipantAvatar[];
  participantTotal?: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  eventLocation: InvitationEventLocation | null;
  dateVotePollStatus?: 'open' | 'closed' | 'confirmed' | null;
};

/** 목록(GET /invitations) 항목 — 상세보다 가벼움. */
export type InvitationListItem = Invitation;

export type CreatedInvitation = {
  id: string;
  title: string;
  description: string;
  mainImageUrl: string;
  eventStartAt: string | null;
};

export type CreateInvitationPayload = {
  title: string;
  description: string;
  mainImageKey?: string;
  mainGifUrl?: string;
  templateId?: string;
  eventStartAt?: string;
  rsvpDeadlineAt?: string | null;
  accessPassword?: string;
  isMissionEnabled?: boolean;
  isPublic?: boolean;
  category?: string;
  fee?: string;
  dressCode?: string;
  parkingInfo?: string;
  bgColor?: string;
  font?: string;
  animation?: string;
  rsvpAttendingEmoji?: string;
  rsvpAttendingLabel?: string;
  rsvpMaybeEmoji?: string;
  rsvpMaybeLabel?: string;
  rsvpDeclinedEmoji?: string;
  rsvpDeclinedLabel?: string;
};

export type UpdateInvitationPayload = {
  title?: string;
  description?: string;
  mainImageKey?: string;
  mainGifUrl?: string;
  mainImageFrame?: MainImageFrame;
  uploadedImageKey?: string | null;
  templateId?: string | null;
  eventStartAt?: string | null;
  rsvpDeadlineAt?: string | null;
  /** 빈 문자열/null = 비밀번호 제거, 값 = 설정/변경 */
  accessPassword?: string | null;
  isMissionEnabled?: boolean;
  isPublic?: boolean;
  category?: string;
  fee?: string | null;
  dressCode?: string | null;
  parkingInfo?: string | null;
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
  /** 낙관적 락: 최근 조회 updatedAt echo. mismatch 시 409 INVITATION_VERSION_CONFLICT */
  expectedUpdatedAt?: string;
};

export type AiJobStatusResponse = {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  resultKey: string | null;
  resultUrl: string | null;
  errorCode: string | null;
  createdAt: string;
  completedAt: string | null;
};

// ── 조회 ────────────────────────────────────────────────────────────────────

/** GET /invitations — 로그인한 본인이 host인 초대장 목록 (createdAt DESC). */
export function fetchMyInvitations(opts: { signal?: AbortSignal } = {}) {
  return apiFetch<InvitationListItem[]>('/invitations', { signal: opts.signal });
}

/** GET /invitations/:id — 초대장 상세 (기본 인증: 내 역할/RSVP 포함). */
export function fetchInvitation(
  id: string,
  opts: { signal?: AbortSignal; authenticated?: boolean } = {},
) {
  return apiFetch<Invitation>(`/invitations/${id}`, {
    signal: opts.signal,
    authenticated: opts.authenticated ?? true,
  });
}

/** GET /invitations/hidden — 숨긴 초대장. */
export function fetchHiddenInvitations(opts: { signal?: AbortSignal } = {}) {
  return apiFetch<InvitationListItem[]>('/invitations/hidden', { signal: opts.signal });
}

// ── 변경 ────────────────────────────────────────────────────────────────────

export function createInvitation(payload: CreateInvitationPayload) {
  return apiFetch<CreatedInvitation>('/invitations', {
    method: 'POST',
    body: payload,
    idempotencyKey: newIdempotencyKey(),
  });
}

export function updateInvitation(id: string, payload: UpdateInvitationPayload) {
  return apiFetch<Invitation>(`/invitations/${id}`, { method: 'PATCH', body: payload });
}

export function updateInvitationStatus(id: string, status: 'active' | 'closed') {
  return apiFetch<Invitation>(`/invitations/${id}`, { method: 'PATCH', body: { status } });
}

export function deleteInvitation(id: string) {
  return apiFetch<void>(`/invitations/${id}`, { method: 'DELETE' });
}

/** 입장 비밀번호 검증. */
export function verifyInvitationAccess(id: string, password: string) {
  return apiFetch<{ valid: boolean }>(`/invitations/${id}/access/verify`, {
    method: 'POST',
    body: { password },
  });
}

/** 초대장 복제 → 새 초대장. */
export function cloneInvitation(id: string) {
  return apiFetch<CreatedInvitation>(`/invitations/${id}/clone`, {
    method: 'POST',
    idempotencyKey: newIdempotencyKey(),
  });
}

// ── 메인 이미지 (presigned 업로드 + AI) ──────────────────────────────────────

/** 초대장 메인 이미지 presigned URL 발급. */
export function getInvitationImagePresignedUrl(fileName: string, contentType: ImageContentType) {
  return apiFetch<{ presignedUrl: string; key: string }>('/invitations/presigned-url', {
    method: 'POST',
    body: { fileName, contentType },
  });
}

export function applyAiToMainImage(invitationId: string, imageKey: string) {
  return apiFetch<{ jobId: string }>(`/invitations/${invitationId}/main-image/ai`, {
    method: 'POST',
    body: { imageKey },
    idempotencyKey: newIdempotencyKey(),
  });
}

export function getAiJobStatus(invitationId: string, jobId: string, opts: { signal?: AbortSignal } = {}) {
  return apiFetch<AiJobStatusResponse>(
    `/invitations/${invitationId}/main-image/ai/jobs/${jobId}`,
    { signal: opts.signal },
  );
}

// ── Query keys ───────────────────────────────────────────────────────────────
// [domain, scope, ...filters]
export const invitationKeys = {
  all: ['invitations'] as const,
  myList: ['invitations', 'me'] as const,
  hidden: ['invitations', 'hidden'] as const,
  detail: (id: string) => ['invitations', 'detail', id] as const,
  aiJob: (id: string, jobId: string) => ['invitations', 'ai-job', id, jobId] as const,
};

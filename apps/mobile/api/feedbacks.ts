// 사진 피드백(댓글) API — 웹 apps/web/src/lib/api/feedbacks.ts 포팅.
// 범위: 사진 낱개 댓글 목록/작성/삭제. (초대장 전체 피드백·수정·좋아요는 범위 제외)
import { apiFetch, newIdempotencyKey } from './client';

export interface FeedbackPhoto {
  id: string;
  imageKey: string;
  url?: string;
}

export interface FeedbackParticipant {
  id: string;
  userId: string;
  memberRole: string;
  user: {
    name: string | null;
    nickname?: string | null;
    profileImageUrl: string | null;
    /** 탈퇴(soft-deleted) 회원 — true면 "탈퇴한 회원"으로 마스킹. */
    isWithdrawn?: boolean;
  };
}

export interface Feedback {
  id: string;
  participantId: string;
  photoId: string | null;
  parentId: string | null;
  content: string | null;
  gifUrl?: string | null;
  likeCount: number;
  likedByMe?: boolean;
  deletedAt: string | null;
  createdAt: string;
  participant: FeedbackParticipant;
  photo: FeedbackPhoto | null;
  attachedPhoto: FeedbackPhoto | null;
  replies: Feedback[];
}

export interface FeedbackListResponse {
  rows: Feedback[];
  nextCursor: string | null;
  total?: number;
}

// ── 조회 ────────────────────────────────────────────────────────────────────

export function fetchPhotoFeedbacks(
  invitationId: string,
  photoId: string,
  opts: { signal?: AbortSignal } = {},
) {
  return apiFetch<FeedbackListResponse>(
    `/invitations/${invitationId}/photos/${photoId}/feedbacks`,
    { signal: opts.signal },
  );
}

// ── 변경 ────────────────────────────────────────────────────────────────────

export function createPhotoFeedback(
  invitationId: string,
  photoId: string,
  payload: {
    content?: string;
    parentId?: string;
    mentionedUserIds?: string[];
    gifUrl?: string;
  },
) {
  return apiFetch<Feedback>(
    `/invitations/${invitationId}/photos/${photoId}/feedbacks`,
    {
      method: 'POST',
      body: {
        ...(payload.content && { content: payload.content }),
        ...(payload.parentId && { parentId: payload.parentId }),
        ...(payload.mentionedUserIds?.length && {
          mentionedUserIds: payload.mentionedUserIds,
        }),
        ...(payload.gifUrl && { gifUrl: payload.gifUrl }),
      },
      idempotencyKey: newIdempotencyKey(),
    },
  );
}

/** 피드백 삭제(soft delete). 엔드포인트는 photos 하위가 아닌 feedbacks 하위. */
export function deletePhotoFeedback(invitationId: string, feedbackId: string) {
  return apiFetch<void>(`/invitations/${invitationId}/feedbacks/${feedbackId}`, {
    method: 'DELETE',
    idempotencyKey: newIdempotencyKey(),
  });
}

// ── Query keys ───────────────────────────────────────────────────────────────
export const feedbackKeys = {
  all: ['feedbacks'] as const,
  photo: (invitationId: string, photoId: string) =>
    ['feedbacks', 'photo', invitationId, photoId] as const,
};

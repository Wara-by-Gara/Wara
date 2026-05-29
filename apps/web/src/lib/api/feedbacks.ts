import { apiDelete, apiGet, apiPatch, apiPost } from './client';

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
  };
}

export interface Feedback {
  id: string;
  participantId: string;
  photoId: string | null;
  parentId: string | null;
  content: string;
  likeCount: number;
  deletedAt: string | null;
  createdAt: string;
  participant: FeedbackParticipant;
  photo: FeedbackPhoto | null;
  replies: Feedback[];
}

export const INVITATION_FEEDBACK_PAGE_SIZE = 10;

export interface FeedbackListResponse {
  rows: Feedback[];
  nextCursor: string | null;
  total?: number;
}

export function getPhotoFeedbacks(
  invitationId: string,
  photoId: string,
): Promise<FeedbackListResponse> {
  return apiGet<FeedbackListResponse>(
    `/invitations/${invitationId}/photos/${photoId}/feedbacks`,
  );
}

export function createPhotoFeedback(
  invitationId: string,
  photoId: string,
  content: string,
  parentId?: string,
): Promise<Feedback> {
  return apiPost<Feedback>(
    `/invitations/${invitationId}/photos/${photoId}/feedbacks`,
    { content, ...(parentId && { parentId }) },
  );
}

export function getInvitationFeedbacks(
  invitationId: string,
  cursor?: string,
  limit = INVITATION_FEEDBACK_PAGE_SIZE,
): Promise<FeedbackListResponse> {
  const params = new URLSearchParams();
  if (cursor) params.set('cursor', cursor);
  params.set('limit', String(limit));
  return apiGet<FeedbackListResponse>(
    `/invitations/${invitationId}/feedbacks/all?${params}`,
  );
}

export function createInvitationFeedback(
  invitationId: string,
  content: string,
  parentId?: string,
): Promise<Feedback> {
  return apiPost<Feedback>(`/invitations/${invitationId}/feedbacks`, {
    content,
    ...(parentId && { parentId }),
  });
}

export function updateFeedback(
  invitationId: string,
  feedbackId: string,
  content: string,
): Promise<Feedback> {
  return apiPatch<Feedback>(
    `/invitations/${invitationId}/feedbacks/${feedbackId}`,
    { content },
  );
}

export function deleteFeedback(
  invitationId: string,
  feedbackId: string,
): Promise<void> {
  return apiDelete(`/invitations/${invitationId}/feedbacks/${feedbackId}`);
}

import { apiDelete, apiGet, apiPatch, apiPost } from './client';

export interface FeedbackPhoto {
  id: string;
  imageKey: string;
}

export interface FeedbackParticipant {
  id: string;
  userId: string;
  memberRole: string;
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

export interface FeedbackListResponse {
  rows: Feedback[];
  nextCursor: string | null;
}

export function getPhotoFeedbacks(
  invitationId: string,
  photoId: string,
  token: string,
): Promise<FeedbackListResponse> {
  return apiGet<FeedbackListResponse>(
    `/invitations/${invitationId}/photos/${photoId}/feedbacks`,
    token,
  );
}

export function createPhotoFeedback(
  invitationId: string,
  photoId: string,
  content: string,
  token: string,
): Promise<Feedback> {
  return apiPost<Feedback>(
    `/invitations/${invitationId}/photos/${photoId}/feedbacks`,
    { content },
    token,
  );
}

export function getInvitationFeedbacks(
  invitationId: string,
  token: string,
  cursor?: string,
): Promise<FeedbackListResponse> {
  const params = new URLSearchParams();
  if (cursor) params.set('cursor', cursor);
  return apiGet<FeedbackListResponse>(
    `/invitations/${invitationId}/feedbacks/all?${params}`,
    token,
  );
}

export function createInvitationFeedback(
  invitationId: string,
  content: string,
  token: string,
): Promise<Feedback> {
  return apiPost<Feedback>(
    `/invitations/${invitationId}/feedbacks`,
    { content },
    token,
  );
}

export function updateFeedback(
  invitationId: string,
  feedbackId: string,
  content: string,
  token: string,
): Promise<Feedback> {
  return apiPatch<Feedback>(
    `invitations/${invitationId}/feedbacks/${feedbackId}`,
    { content },
    token,
  );
}

export function deleteFeedback(
  invitationId: string,
  feedbackId: string,
  token: string,
): Promise<void> {
  return apiDelete(
    `/invitations/${invitationId}/feedbacks/${feedbackId}`,
    token,
  );
}
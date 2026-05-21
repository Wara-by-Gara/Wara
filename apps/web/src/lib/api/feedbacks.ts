import { apiGet, apiPost } from "./client";

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
// 사진 피드백(댓글) 쿼리 훅 — 목록·작성·삭제.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  createPhotoFeedback,
  deletePhotoFeedback,
  feedbackKeys,
  fetchPhotoFeedbacks,
} from '@/api/feedbacks';
import { photoKeys } from '@/api/photos';

export function usePhotoFeedbacks(invitationId: string, photoId: string) {
  return useQuery({
    queryKey: feedbackKeys.photo(invitationId, photoId),
    queryFn: ({ signal }) => fetchPhotoFeedbacks(invitationId, photoId, { signal }),
    enabled: !!invitationId && !!photoId,
  });
}

/** 댓글 작성 후 목록·사진 상세(feedbackCount)·앨범 목록을 무효화. */
function useFeedbackInvalidation(invitationId: string, photoId: string) {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: feedbackKeys.photo(invitationId, photoId) });
    qc.invalidateQueries({ queryKey: photoKeys.detail(invitationId, photoId) });
    qc.invalidateQueries({ queryKey: photoKeys.list(invitationId) });
  };
}

export function useCreatePhotoFeedback(invitationId: string, photoId: string) {
  const invalidate = useFeedbackInvalidation(invitationId, photoId);
  return useMutation({
    mutationFn: (payload: {
      content?: string;
      parentId?: string;
      mentionedUserIds?: string[];
      gifUrl?: string;
    }) => createPhotoFeedback(invitationId, photoId, payload),
    onSuccess: invalidate,
  });
}

export function useDeletePhotoFeedback(invitationId: string, photoId: string) {
  const invalidate = useFeedbackInvalidation(invitationId, photoId);
  return useMutation({
    mutationFn: (feedbackId: string) => deletePhotoFeedback(invitationId, feedbackId),
    onSuccess: invalidate,
  });
}

// 피드백(댓글) 쿼리 훅 — 사진 댓글 + 초대장 전체 댓글 목록·작성·삭제.
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  INVITATION_FEEDBACK_PAGE_SIZE,
  createInvitationFeedback,
  createPhotoFeedback,
  deleteFeedback,
  feedbackKeys,
  fetchInvitationFeedbacks,
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
    mutationFn: (feedbackId: string) => deleteFeedback(invitationId, feedbackId),
    onSuccess: invalidate,
  });
}

// ── 초대장 전체 댓글 (활동 피드 댓글, F-DPZZXZ) ────────────────────────────────

/** 초대장 전체 댓글 목록 — 커서 무한 스크롤 (웹 useInvitationFeedback 페이지 규칙 미러). */
export function useInvitationFeedbacks(invitationId: string) {
  return useInfiniteQuery({
    queryKey: feedbackKeys.invitation(invitationId),
    queryFn: ({ pageParam, signal }) =>
      fetchInvitationFeedbacks(invitationId, { cursor: pageParam, signal }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage, allPages) => {
      const total = allPages[0]?.total;
      const loaded = allPages.reduce((sum, page) => sum + page.rows.length, 0);
      if (total != null && loaded >= total) return undefined;
      if (!lastPage.nextCursor) return undefined;
      if (lastPage.rows.length < INVITATION_FEEDBACK_PAGE_SIZE) return undefined;
      return lastPage.nextCursor;
    },
    enabled: !!invitationId,
  });
}

export function useCreateInvitationFeedback(invitationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { content?: string; parentId?: string; gifUrl?: string }) =>
      createInvitationFeedback(invitationId, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: feedbackKeys.invitation(invitationId) }),
  });
}

export function useDeleteInvitationFeedback(invitationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (feedbackId: string) => deleteFeedback(invitationId, feedbackId),
    onSuccess: () => qc.invalidateQueries({ queryKey: feedbackKeys.invitation(invitationId) }),
  });
}

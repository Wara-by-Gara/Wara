// 피드백(댓글) 쿼리 훅 — 사진 댓글 + 초대장 전체 댓글 목록·작성·수정·삭제·좋아요(낙관적).
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query';

import {
  INVITATION_FEEDBACK_PAGE_SIZE,
  createInvitationFeedback,
  createPhotoFeedback,
  deleteFeedback,
  feedbackKeys,
  fetchInvitationFeedbacks,
  fetchPhotoFeedbacks,
  toggleFeedbackLike,
  updateFeedback,
  type Feedback,
  type FeedbackListResponse,
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
    mutationFn: (payload: {
      content?: string;
      parentId?: string;
      attachedPhotoId?: string;
      gifUrl?: string;
    }) => createInvitationFeedback(invitationId, payload),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: feedbackKeys.invitation(invitationId) });
      // 사진 첨부 댓글은 앨범에도 새 사진이 등록되므로 앨범 목록도 갱신.
      if (variables.attachedPhotoId) {
        qc.invalidateQueries({ queryKey: photoKeys.list(invitationId) });
      }
    },
  });
}

/** 본인 댓글 본문 수정 (content만 — 웹 editComment 계약 미러). */
export function useUpdateInvitationFeedback(invitationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { feedbackId: string; content: string }) =>
      updateFeedback(invitationId, vars.feedbackId, vars.content),
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

// ── 댓글 좋아요 (낙관적) ───────────────────────────────────────────────────────

type FeedbackPages = InfiniteData<FeedbackListResponse, string | undefined>;

/** 최상위 댓글·답글에서 대상 피드백의 likedByMe/likeCount를 토글. */
function toggleLikeInRows(rows: Feedback[], feedbackId: string): Feedback[] {
  return rows.map((row) => {
    if (row.id === feedbackId) {
      const liked = !(row.likedByMe ?? false);
      return {
        ...row,
        likedByMe: liked,
        likeCount: Math.max(0, row.likeCount + (liked ? 1 : -1)),
      };
    }
    if (row.replies.length === 0) return row;
    return { ...row, replies: toggleLikeInRows(row.replies, feedbackId) };
  });
}

/**
 * 초대장 댓글 좋아요 토글 — 무한 목록 캐시를 낙관적으로 갱신 후 실패 시 롤백.
 * 웹 useInvitationFeedback.toggleLike 미러: 성공 시 invalidate하지 않아
 * refetch 깜빡임을 피한다(다음 자연 refetch 때 서버값으로 수렴).
 */
export function useToggleFeedbackLike(invitationId: string) {
  const qc = useQueryClient();
  const listKey = feedbackKeys.invitation(invitationId);

  return useMutation({
    mutationFn: (feedbackId: string) => toggleFeedbackLike(invitationId, feedbackId),
    onMutate: async (feedbackId: string) => {
      await qc.cancelQueries({ queryKey: listKey });
      const previous = qc.getQueryData<FeedbackPages>(listKey);
      qc.setQueryData<FeedbackPages>(listKey, (old) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            rows: toggleLikeInRows(page.rows, feedbackId),
          })),
        };
      });
      return { previous };
    },
    onError: (_err, _feedbackId, ctx) => {
      if (ctx?.previous) qc.setQueryData(listKey, ctx.previous);
    },
  });
}

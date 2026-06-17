import { createInvitationFeedback, deleteFeedback, getInvitationFeedbacks, toggleFeedbackLike, updateFeedback, INVITATION_FEEDBACK_PAGE_SIZE } from '@/lib/api/feedbacks';
import { getPresignedUrl, registerPhoto } from '@/lib/api/photos';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { useRef, useState } from 'react';

const ALLOWED_CONTENT_TYPES: Record<string, string> = {
  'image/jpeg': 'image/jpeg',
  'image/png': 'image/png',
  'image/webp': 'image/webp',
  'image/heic': 'image/heic',
  'image/heif': 'image/heif',
};

function resolveContentType(file: File): string | null {
  if (ALLOWED_CONTENT_TYPES[file.type]) return file.type;
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (ext === 'heic') return 'image/heic';
  if (ext === 'heif') return 'image/heif';
  return null;
}

export function useInvitationFeedback(invitationId: string) {
  const queryClient = useQueryClient();
  const queryKey = ['invitations', invitationId, 'feedbacks'];
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [likedMap, setLikedMap] = useState<Map<string, boolean>>(new Map());
  const [likeCountMap, setLikeCountMap] = useState<Map<string, number>>(new Map());
  const pendingLikeIdsRef = useRef<Set<string>>(new Set());

  const query = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam }) =>
      getInvitationFeedbacks(invitationId, pageParam, INVITATION_FEEDBACK_PAGE_SIZE),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage, allPages) => {
      const total = allPages[0]?.total;
      const loaded = allPages.reduce((sum, page) => sum + page.rows.length, 0);
      if (total != null && loaded >= total) return undefined;
      if (!lastPage?.nextCursor) return undefined;
      if (lastPage.rows.length < INVITATION_FEEDBACK_PAGE_SIZE) return undefined;
      return lastPage.nextCursor;
    },
    enabled: !!invitationId,
  });

  const submitComment = async (content: string, parentId?: string, attachedFile?: File, mentionedUserIds?: string[], gifUrl?: string) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      let attachedPhotoId: string | undefined;
      if (attachedFile) {
        const contentType = resolveContentType(attachedFile);
        if (contentType) {
          const { presignedUrl, key } = await getPresignedUrl(invitationId, attachedFile.name, contentType);
          const putRes = await fetch(presignedUrl, { method: 'PUT', headers: { 'Content-Type': contentType }, body: attachedFile });
          // fetch는 4xx/5xx에 throw하지 않음 — 실패해도 진행하면 S3 객체 없는 사진이 등록됨
          if (!putRes.ok) throw new Error('PHOTO_UPLOAD_FAILED');
          const photo = await registerPhoto(invitationId, key);
          attachedPhotoId = photo.id;
          queryClient.invalidateQueries({ queryKey: QUERY_KEYS.invitations.photos(invitationId) });
        }
      }
      await createInvitationFeedback(invitationId, content, parentId, attachedPhotoId, mentionedUserIds, gifUrl);
      queryClient.invalidateQueries({ queryKey });
    } finally {
      setIsSubmitting(false);
    }
  };

  const removeComment = async (feedbackId: string, photoId?: string) => {
    await deleteFeedback(invitationId, feedbackId);
    queryClient.invalidateQueries({ queryKey });
    if (photoId) {
      queryClient.invalidateQueries({ queryKey: ['invitations', invitationId, 'photos', photoId, 'feedbacks'] });
    }
  };

  const editComment = async (feedbackId: string, content: string, photoId?: string) => {
    await updateFeedback(invitationId, feedbackId, content);
    queryClient.invalidateQueries({ queryKey });
    if (photoId) {
      queryClient.invalidateQueries({ queryKey: ['invitations', invitationId, 'photos', photoId, 'feedbacks'] });
    }
  };

  const toggleLike = async (feedbackId: string, currentLiked: boolean, currentCount: number) => {
    if (pendingLikeIdsRef.current.has(feedbackId)) return;

    const newLiked = !currentLiked;
    const newCount = Math.max(0, newLiked ? currentCount + 1 : currentCount - 1);

    pendingLikeIdsRef.current.add(feedbackId);
    setLikedMap((prev) => new Map(prev).set(feedbackId, newLiked));
    setLikeCountMap((prev) => new Map(prev).set(feedbackId, newCount));

    try {
      const { liked } = await toggleFeedbackLike(invitationId, feedbackId);
      setLikedMap((prev) => new Map(prev).set(feedbackId, liked));
      setLikeCountMap((prev) => new Map(prev).set(feedbackId, newCount));
      // 목록 전체 invalidate 제거 — 좋아요 상태는 로컬 맵으로 반영되며,
      // refetch 시 아바타(next/image) 재요청으로 깜빡임 발생하던 문제 방지.
    } catch {
      setLikedMap((prev) => new Map(prev).set(feedbackId, currentLiked));
      setLikeCountMap((prev) => new Map(prev).set(feedbackId, currentCount));
    } finally {
      pendingLikeIdsRef.current.delete(feedbackId);
    }
  };

  const getLiked = (id: string, serverVal: boolean) => likedMap.has(id) ? likedMap.get(id)! : serverVal;
  const getLikeCount = (id: string, serverVal: number) => likeCountMap.has(id) ? likeCountMap.get(id)! : serverVal;

  const total = query.data?.pages[0]?.total;
  const loadedCount = query.data?.pages.flatMap((p) => p.rows).length ?? 0;
  const canLoadMore =
    (query.hasNextPage ?? false) &&
    (total == null || loadedCount < total);

  return {
    ...query,
    total,
    loadedCount,
    canLoadMore,
    submitComment,
    removeComment,
    editComment,
    isSubmitting,
    toggleLike,
    getLiked,
    getLikeCount,
  };
}
import { createInvitationFeedback, deleteFeedback, getInvitationFeedbacks, toggleFeedbackLike, updateFeedback, INVITATION_FEEDBACK_PAGE_SIZE } from '@/lib/api/feedbacks';
import { getPresignedUrl, registerPhoto } from '@/lib/api/photos';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

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

  const query = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam }) =>
      getInvitationFeedbacks(invitationId, pageParam, INVITATION_FEEDBACK_PAGE_SIZE),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => {
      if (!lastPage?.nextCursor) return undefined;
      if (lastPage.rows.length === 0) return undefined;
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
          await fetch(presignedUrl, { method: 'PUT', headers: { 'Content-Type': contentType }, body: attachedFile });
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
    const newLiked = !currentLiked;
    setLikedMap(prev => new Map(prev).set(feedbackId, newLiked));
    setLikeCountMap(prev => new Map(prev).set(feedbackId, newLiked ? currentCount + 1 : currentCount - 1));
    try {
      await toggleFeedbackLike(invitationId, feedbackId);
      setLikedMap(prev => { const m = new Map(prev); m.delete(feedbackId); return m; });
      setLikeCountMap(prev => { const m = new Map(prev); m.delete(feedbackId); return m; });
      queryClient.invalidateQueries({ queryKey });
    } catch {
      setLikedMap(prev => new Map(prev).set(feedbackId, currentLiked));
      setLikeCountMap(prev => new Map(prev).set(feedbackId, currentCount));
    }
  };

  const getLiked = (id: string, serverVal: boolean) => likedMap.has(id) ? likedMap.get(id)! : serverVal;
  const getLikeCount = (id: string, serverVal: number) => likeCountMap.has(id) ? likeCountMap.get(id)! : serverVal;

  return { ...query, submitComment, removeComment, editComment, isSubmitting, toggleLike, getLiked, getLikeCount };
}
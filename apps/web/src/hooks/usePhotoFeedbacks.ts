import { createPhotoFeedback, getPhotoFeedbacks, toggleFeedbackLike, updateFeedback, deleteFeedback } from '@/lib/api/feedbacks';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRef, useState } from 'react';

export function usePhotoFeedback(
  invitationId: string,
  photoId: string,
) {
  const queryClient = useQueryClient();
  const [likedMap, setLikedMap] = useState<Map<string, boolean>>(new Map());
  const [likeCountMap, setLikeCountMap] = useState<Map<string, number>>(new Map());
  const pendingLikeIdsRef = useRef<Set<string>>(new Set());
  const queryKey = [
    'invitations',
    invitationId,
    'photos',
    photoId,
    'feedbacks',
  ];

  const query = useQuery({
    queryKey,
    queryFn: () => getPhotoFeedbacks(invitationId, photoId),
    enabled: !!invitationId && !!photoId,
  });

  const invitationFeedbackKey = ['invitations', invitationId, 'feedbacks'];

  const submitComment = async (text: string, parentId?: string, mentionedUserIds?: string[], gifUrl?: string) => {
    await createPhotoFeedback(invitationId, photoId, text, parentId, mentionedUserIds, gifUrl);
    queryClient.invalidateQueries({ queryKey });
    queryClient.invalidateQueries({ queryKey: invitationFeedbackKey });
  };

  const updateComment = async (feedbackId: string, content: string) => {
    await updateFeedback(invitationId, feedbackId, content);
    queryClient.invalidateQueries({ queryKey });
    queryClient.invalidateQueries({ queryKey: invitationFeedbackKey });
  };

  const deleteComment = async (feedbackId: string) => {
    await deleteFeedback(invitationId, feedbackId);
    queryClient.invalidateQueries({ queryKey });
    queryClient.invalidateQueries({ queryKey: invitationFeedbackKey });
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
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: invitationFeedbackKey });
    } catch {
      setLikedMap((prev) => new Map(prev).set(feedbackId, currentLiked));
      setLikeCountMap((prev) => new Map(prev).set(feedbackId, currentCount));
    } finally {
      pendingLikeIdsRef.current.delete(feedbackId);
    }
  };

  const getLiked = (id: string, serverVal: boolean) => likedMap.has(id) ? likedMap.get(id)! : serverVal;
  const getLikeCount = (id: string, serverVal: number) => likeCountMap.has(id) ? likeCountMap.get(id)! : serverVal;

  return { ...query, submitComment, updateComment, deleteComment, toggleLike, getLiked, getLikeCount };
}

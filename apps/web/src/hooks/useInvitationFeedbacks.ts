import {
  createInvitationFeedback,
  deleteFeedback,
  getInvitationFeedbacks,
  INVITATION_FEEDBACK_PAGE_SIZE,
  updateFeedback,
} from '@/lib/api/feedbacks';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

export function useInvitationFeedback(invitationId: string) {
  const queryClient = useQueryClient();
  const queryKey = ['invitations', invitationId, 'feedbacks'];
  const [isSubmitting, setIsSubmitting] = useState(false);

  const query = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam }) =>
      getInvitationFeedbacks(invitationId, pageParam, INVITATION_FEEDBACK_PAGE_SIZE),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: !!invitationId,
  });

  const submitComment = async (content: string, parentId?: string) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await createInvitationFeedback(invitationId, content, parentId);
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

  return { ...query, submitComment, removeComment, editComment, isSubmitting };
}
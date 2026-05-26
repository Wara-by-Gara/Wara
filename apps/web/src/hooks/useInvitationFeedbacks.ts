import { createInvitationFeedback, deleteFeedback, getInvitationFeedbacks, updateFeedback } from '@/lib/api/feedbacks';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';

export function useInvitationFeedback(invitationId: string) {
  const queryClient = useQueryClient();
  const queryKey = ['invitations', invitationId, 'feedbacks'];

  const query = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam }) => getInvitationFeedbacks(invitationId, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: !!invitationId,
  });

  const submitComment = async (content: string) => {
    await createInvitationFeedback(invitationId, content);
    queryClient.invalidateQueries({ queryKey });
  };

  const removeComment = async (feedbackId: string) => {
    await deleteFeedback(invitationId, feedbackId);
    queryClient.invalidateQueries({queryKey})
  }

  const editComment = async (feedbackId: string, content: string) => {
    await updateFeedback(invitationId, feedbackId, content);
    queryClient.invalidateQueries({queryKey})
  }

  return { ...query, submitComment, removeComment,editComment };
}

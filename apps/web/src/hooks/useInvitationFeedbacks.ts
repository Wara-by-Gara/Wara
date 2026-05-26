import { createInvitationFeedback, deleteFeedback, getInvitationFeedbacks, updateFeedback } from '@/lib/api/feedbacks';
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';

export function useInvitationFeedback(invitationId: string, token: string) {
  const queryClient = useQueryClient();
  const queryKey = ['invitations', invitationId, 'feedbacks'];

  const query = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam }) => getInvitationFeedbacks(invitationId, token, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: !!invitationId && !!token,
  });

  const submitComment = async (content: string) => {
    await createInvitationFeedback(invitationId, content, token);
    queryClient.invalidateQueries({ queryKey });
  };

  const removeComment = async (feedbackId: string) => {
    await deleteFeedback(invitationId, feedbackId, token);
    queryClient.invalidateQueries({queryKey})
  }

  const editComment = async (feedbackId: string, content: string) => {
    await updateFeedback(invitationId, feedbackId, content, token);
    queryClient.invalidateQueries({queryKey})
  }

  return { ...query, submitComment, removeComment,editComment };
}

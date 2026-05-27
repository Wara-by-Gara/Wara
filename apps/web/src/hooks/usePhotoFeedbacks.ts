import { createPhotoFeedback, getPhotoFeedbacks, updateFeedback, deleteFeedback } from '@/lib/api/feedbacks';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export function usePhotoFeedback(
  invitationId: string,
  photoId: string,
) {
  const queryClient = useQueryClient();
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

  const submitComment = async (text: string) => {
    await createPhotoFeedback(invitationId, photoId, text);
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

  return { ...query, submitComment, updateComment, deleteComment };
}

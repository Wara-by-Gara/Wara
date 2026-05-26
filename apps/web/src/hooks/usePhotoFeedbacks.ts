import { createPhotoFeedback, getPhotoFeedbacks } from '@/lib/api/feedbacks';
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

  const submitComment = async (text: string) => {
    await createPhotoFeedback(invitationId, photoId, text);
    queryClient.invalidateQueries({ queryKey });
  };

  return { ...query, submitComment };
}

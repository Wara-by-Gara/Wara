import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getPhoto, togglePhotoLike } from "@/lib/api/photos";
import { QUERY_KEYS } from "@/constants/queryKeys";

export function usePhotoDetail(invitationId: string, photoId: string, token: string, initialLikeCount = 0) {
  const queryClient = useQueryClient();
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(initialLikeCount);

  const trackView = () => {
    if (!token) return;
    getPhoto(invitationId, photoId);
  };

  const toggleLike = async () => {
    const result = await togglePhotoLike(invitationId, photoId);
    setLiked(result.liked);
    setLikeCount((prev) => result.liked ? prev + 1 : prev - 1);
    queryClient.invalidateQueries({
      queryKey: QUERY_KEYS.invitations.photos(invitationId),
    });
  };

  return { liked, likeCount, toggleLike, trackView };
}
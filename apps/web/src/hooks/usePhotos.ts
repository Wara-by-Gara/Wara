import { useInfiniteQuery } from "@tanstack/react-query";
import { getPhotos } from "@/lib/api/photos";
import { QUERY_KEYS } from "@/constants/queryKeys";

export function usePhotos(invitationId: string, token: string) {
  const limit = typeof window !== 'undefined' && window.innerWidth < 768 ? 9 : 8;

  return useInfiniteQuery({
    queryKey: QUERY_KEYS.invitations.photos(invitationId),
    queryFn: ({ pageParam }) => getPhotos(invitationId, token, pageParam, limit),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: !!invitationId && !!token,
  });
}
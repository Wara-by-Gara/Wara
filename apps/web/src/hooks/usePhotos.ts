import { useInfiniteQuery } from "@tanstack/react-query";
import { getPhotos } from "@/lib/api/photos";
import { QUERY_KEYS } from "@/constants/queryKeys";

export function usePhotos(invitationId: string) {
  const limit = typeof window !== 'undefined' && window.innerWidth < 768 ? 9 : 8;

  const query = useInfiniteQuery({
    queryKey: QUERY_KEYS.invitations.photos(invitationId),
    queryFn: ({ pageParam }) => getPhotos(invitationId, pageParam, limit),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: !!invitationId,
  });

  const fetchAllPages = async () => {
    let hasMore = query.hasNextPage;
    while (hasMore) {
      const result = await query.fetchNextPage();
      hasMore = result.hasNextPage ?? false;
    }
  };

  return { ...query, fetchAllPages };
}
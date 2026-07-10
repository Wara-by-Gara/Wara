// 사진(앨범) 쿼리 훅 — 목록(무한 스크롤)·상세·Best9·좋아요(낙관적)·삭제.
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query';

import {
  deletePhoto,
  fetchBest9,
  fetchInvitationPhotos,
  fetchPhoto,
  photoKeys,
  togglePhotoLike,
  type PhotoListResponse,
} from '@/api/photos';

const PAGE_SIZE = 20;

export function useInvitationPhotos(invitationId: string) {
  return useInfiniteQuery({
    queryKey: photoKeys.list(invitationId),
    queryFn: ({ pageParam, signal }) =>
      fetchInvitationPhotos(invitationId, {
        cursor: pageParam,
        limit: PAGE_SIZE,
        signal,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: !!invitationId,
  });
}

export function usePhoto(invitationId: string, photoId: string) {
  return useQuery({
    queryKey: photoKeys.detail(invitationId, photoId),
    queryFn: ({ signal }) => fetchPhoto(invitationId, photoId, { signal }),
    enabled: !!invitationId && !!photoId,
  });
}

export function useBest9(invitationId: string) {
  return useQuery({
    queryKey: photoKeys.best9(invitationId),
    queryFn: ({ signal }) => fetchBest9(invitationId, { signal }),
    enabled: !!invitationId,
  });
}

type PhotoPages = InfiniteData<PhotoListResponse, string | undefined>;

/** 좋아요 토글 — 무한 목록 캐시를 낙관적으로 갱신 후 실패 시 롤백. */
export function useTogglePhotoLike(invitationId: string) {
  const qc = useQueryClient();
  const listKey = photoKeys.list(invitationId);

  return useMutation({
    mutationFn: (photoId: string) => togglePhotoLike(invitationId, photoId),
    onMutate: async (photoId: string) => {
      await qc.cancelQueries({ queryKey: listKey });
      const previous = qc.getQueryData<PhotoPages>(listKey);
      qc.setQueryData<PhotoPages>(listKey, (old) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            rows: page.rows.map((photo) => {
              if (photo.id !== photoId) return photo;
              const liked = !photo.liked;
              return {
                ...photo,
                liked,
                likeCount: Math.max(0, photo.likeCount + (liked ? 1 : -1)),
              };
            }),
          })),
        };
      });
      return { previous };
    },
    onError: (_err, _photoId, ctx) => {
      if (ctx?.previous) qc.setQueryData(listKey, ctx.previous);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: listKey });
    },
  });
}

export function useDeletePhoto(invitationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (photoId: string) => deletePhoto(invitationId, photoId),
    onSuccess: () => qc.invalidateQueries({ queryKey: photoKeys.list(invitationId) }),
  });
}

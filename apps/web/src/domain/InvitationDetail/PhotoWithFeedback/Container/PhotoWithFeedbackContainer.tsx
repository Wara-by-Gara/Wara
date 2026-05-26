'use client';

import { usePhotos } from "@/hooks/usePhotos";
import { InvitationDetailProps } from "../../types";
import Album from "../Album/Album";

export default function PhotoWithFeedbackContainer({ invitationId }: InvitationDetailProps) {
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = usePhotos(invitationId);
  const photos = data?.pages.flatMap((p) => p.rows) ?? [];

  if (isLoading) return <div>로딩중 ....</div>;

  return (
    <>
      <Album
        photos={photos}
        fetchNextPage={fetchNextPage}
        hasNextPage={!!hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
      />
      <div>댓글</div>
    </>
  );
}
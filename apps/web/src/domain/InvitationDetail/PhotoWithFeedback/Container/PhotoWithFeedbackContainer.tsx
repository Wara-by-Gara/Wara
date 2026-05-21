'use client';

import { useState, useEffect } from "react";
import { usePhotos } from "@/hooks/usePhotos";
import { InvitationDetailProps } from "../../types";
import Album from "../Album/Album";

export default function PhotoWithFeedbackContainer({ invitationId }: InvitationDetailProps) {
  const [token, setToken] = useState("");

  useEffect(() => {
    setToken(localStorage.getItem("access_token") ?? "");
  }, []);

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = usePhotos(invitationId, token);
  const photos = data?.pages.flatMap((p) => p.rows) ?? [];

console.log('page2 rows', data?.pages[1]?.rows.length);
  if (isLoading && token) return <div>로딩중 ....</div>;

  return (
    <>
      <Album
        photos={photos}
        invitationId={invitationId}
        fetchNextPage={fetchNextPage}
        hasNextPage={!!hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
      />
      <div>댓글</div>
    </>
  );
}
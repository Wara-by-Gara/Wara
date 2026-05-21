'use client';

import { useState } from "react";
import { Photo } from "@/lib/api/photos";
import AlbumModal from "../AlbumModal/AlbumModal";

interface Props {
  photos: Photo[];
  invitationId: string;
  fetchNextPage: () => void;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
}

export default function Album({ photos, invitationId, fetchNextPage, hasNextPage,isFetchingNextPage }: Props) {
  const [showModal, setShowModal] = useState(false);
  const preview = photos.slice(0, 4);

  return (
    <div className="mt-4 px-4">
      {/* 헤더 */}
      <div className="flex justify-between items-center mb-3">
        <span className="font-medium">Gallery</span>
        <button
          onClick={() => setShowModal(true)}
          className="text-sm text-gray-400"
        >
          View All &gt;
        </button>
      </div>

      {/* 4열 프리뷰 */}
      <div className="grid grid-cols-4 gap-1">
        {preview.map((photo) => (
          <img
            key={photo.id}
            src={photo.url}
            alt=""
            className="w-full aspect-square object-cover rounded-lg cursor-pointer"
            onClick={() => setShowModal(true)}
          />
        ))}
      </div>

      {/* 앨범 모달 */}
      {showModal && (
       <AlbumModal
          photos={photos}
          onClose={() => setShowModal(false)}
          fetchNextPage={fetchNextPage}
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
        />
      )}
    </div>
  );
}
'use client';

import { useState } from "react";
import Image from "next/image";
import { Photo } from "@/lib/api/photos";
import AlbumModal from "../AlbumModal/AlbumModal";

interface Props {
  photos: Photo[];
  fetchNextPage: () => void;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
}

export default function Album({ photos, fetchNextPage, hasNextPage, isFetchingNextPage }: Props) {
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
          <div
            key={photo.id}
            className="relative aspect-square cursor-pointer"
            onClick={() => setShowModal(true)}
          >
            <Image
              src={photo.url}
              alt=""
              fill
              className="object-cover rounded-lg"
            />
          </div>
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
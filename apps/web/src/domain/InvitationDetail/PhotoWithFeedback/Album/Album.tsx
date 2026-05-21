'use client';

import { useState } from "react";
import { Photo } from "@/lib/api/photos";
import AlbumModal from "../AlbumModal/AlbumModal";
import PhotoDetailModal from "../PhotoDetailModal/PhotoDetailModal";
import { PhotoGrid } from "@/components/organisms/PhotoGrid";
import { PhotoGridItem } from "@/components/organisms/PhotoGridItem";

interface Props {
  photos: Photo[];
  total: number;
  fetchNextPage: () => void;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
}

export default function Album({ photos, total, fetchNextPage, hasNextPage, isFetchingNextPage }: Props) {
  const [showModal, setShowModal] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const preview = photos.slice(0, 5);
  const remaining = total - 5;

  return (
    <>
      {/* 헤더 */}
      <div className="rounded-3xl border border-border bg-surface p-4">
        <span className="mb-2 text-[15px] font-bold text-text-primary">앨범</span>

      {/* 그리드 */}
      <PhotoGrid>
        {preview.map((photo, idx) => (
          <PhotoGridItem
          key={photo.id}
          src={photo.url}
          alt=""
          onClick={() => setSelectedIndex(idx)}
          />
        ))}
        {remaining > 0 && (
          <PhotoGridItem
          overflowLabel={`+${remaining}`}
          onClick={() => setShowModal(true)}
          />
        )}
      </PhotoGrid>
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

      {/* 사진 상세 모달 */}
      {selectedIndex !== null && (
        <PhotoDetailModal
          photos={photos}
          initialIndex={selectedIndex}
          onClose={() => setSelectedIndex(null)}
        />
      )}
    </>
  );
}
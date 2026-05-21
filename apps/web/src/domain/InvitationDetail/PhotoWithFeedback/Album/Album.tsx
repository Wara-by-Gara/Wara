'use client';

import { useState } from 'react';
import { Photo } from '@/lib/api/photos';
import AlbumModal from '../AlbumModal/AlbumModal';
import PhotoDetailModal from '../PhotoDetailModal/PhotoDetailModal';
import { PhotoGrid } from '@/components/organisms/PhotoGrid';
import { PhotoGridItem } from '@/components/organisms/PhotoGridItem';

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
  const [likedMap, setLikedMap] = useState<Map<string, boolean>>(new Map());
  const [likeCountMap, setLikeCountMap] = useState<Map<string, number>>(new Map());
  const preview = photos.slice(0, 5);
  const remaining = total - 5;

  const handleLikeChange = (photoId: string, liked: boolean, likeCount: number) => {
    setLikedMap((prev) => new Map(prev).set(photoId, liked));
    setLikeCountMap((prev) => new Map(prev).set(photoId, likeCount));
  };

  return (
    <>
      <div className="rounded-3xl border border-border bg-surface p-4">
        <span className="mb-2 text-[15px] font-bold text-text-primary">앨범</span>

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

      {showModal && (
        <AlbumModal
          photos={photos}
          onClose={() => setShowModal(false)}
          fetchNextPage={fetchNextPage}
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
        />
      )}

      {selectedIndex !== null && (
        <PhotoDetailModal
          photos={photos}
          initialIndex={selectedIndex}
          onClose={() => setSelectedIndex(null)}
          likedMap={likedMap}
          likeCountMap={likeCountMap}
          onLikeChange={handleLikeChange}
        />
      )}
    </>
  );
}
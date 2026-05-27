'use client';

import { useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import { Photo } from '@/lib/api/photos';
import PhotoDetailModal from '../PhotoDetailModal/PhotoDetailModal';

interface Props {
  photos: Photo[];
  onClose: () => void;
  fetchNextPage: () => void;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
}

export default function AlbumModal({ photos, onClose, fetchNextPage, hasNextPage, isFetchingNextPage }: Props) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

const toggleSelect = (id: string) => {
  setSelectedIds((prev) => {
    const next = new Set(prev);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    return next;
  });
};


const handleScroll = useCallback(() => {
  const el = scrollRef.current;
  if (!el) return;
  if (el.scrollTop + el.clientHeight >= el.scrollHeight - 50 && hasNextPage && !isFetchingNextPage) {
    fetchNextPage();
  }
}, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-white w-[340px] h-[430px] md:w-[600px] md:h-[380px] rounded-2xl flex flex-col overflow-hidden">
        {/* 헤더 */}
        <div className="flex justify-between items-center px-4 py-3 border-b">
          <button onClick={onClose} className="text-xl">✕</button>
          <span className="font-medium">Gallery</span>
          <button
            onClick={() => setIsSelectMode((prev) => !prev)}
            className="text-sm text-gray-500"
          >
            {isSelectMode ? '취소' : '선택'}
          </button>
        </div>

        {/* 다운로드 버튼 */}
        <div className="flex justify-between items-center px-4 py-2">
          <span className="text-sm text-gray-400">{photos.length}장</span>
          <div className="flex gap-2">
            {isSelectMode && selectedIds.size > 0 && (
              <button className="text-sm border px-3 py-1 rounded-full">
                선택 다운로드 ({selectedIds.size})
              </button>
            )}
            <button className="text-sm border px-3 py-1 rounded-full">
              전체 다운로드
            </button>
          </div>
        </div>

        {/* 그리드 */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="overflow-y-auto min-h-0 flex-1"
        >
          <div className="grid grid-cols-3 md:grid-cols-4 gap-0.5">
            {photos.map((photo, idx) => (
              <div
                key={photo.id}
                className="relative aspect-square cursor-pointer bg-gray-200"
                onClick={() => {
                  if (isSelectMode) {
                    toggleSelect(photo.id);
                  } else {
                    setSelectedIndex(idx);
                  }
                }}
              >
                <Image src={photo.url} alt="" fill className="object-cover" />
                {isSelectMode && (
                  <div className={`absolute top-1 right-1 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center ${selectedIds.has(photo.id) ? 'bg-black' : 'bg-white/50'}`}>
                    {selectedIds.has(photo.id) && <span className="text-white text-xs">✓</span>}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {selectedIndex !== null && (
        <PhotoDetailModal
          photos={photos}
          initialIndex={selectedIndex}
          onClose={() => setSelectedIndex(null)}
        />
      )}
    </div>
  );
}
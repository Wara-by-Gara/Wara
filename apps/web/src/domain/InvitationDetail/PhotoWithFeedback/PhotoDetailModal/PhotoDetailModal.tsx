'use client';

import { useState, useEffect } from "react";
import Image from "next/image";
import { Photo, getPhoto } from "@/lib/api/photos";

interface Props {
  photos: Photo[];
  initialIndex: number;
  onClose: () => void;
}

export default function PhotoDetailModal({ photos, initialIndex, onClose }: Props) {
  const [index, setIndex] = useState(initialIndex);
  const photo = photos[index]!;

  useEffect(() => {
    getPhoto(photo.invitationId, photo.id);
  }, [photo.id, photo.invitationId]);

  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center">
      <div className="bg-white w-[340px] md:w-[700px] h-[600px] md:h-[500px] rounded-2xl flex flex-col md:flex-row overflow-hidden relative">

        {/* 사진 영역 */}
        <div className="flex-1 flex items-center justify-center relative bg-black">
          {index > 0 && (
            <button
              onClick={() => setIndex((i) => i - 1)}
              className="absolute left-4 text-white text-4xl z-10"
            >
              ‹
            </button>
          )}
          <Image
            src={photo.url}
            alt=""
            fill
            className="object-contain"
          />
          {index < photos.length - 1 && (
            <button
              onClick={() => setIndex((i) => i + 1)}
              className="absolute right-4 text-white text-4xl z-10"
            >
              ›
            </button>
          )}
        </div>

        {/* 댓글 - 모바일: 하단, 웹: 우측 */}
        <div className="w-full md:w-72 bg-white flex flex-col">
          <div className="p-4 border-b flex justify-between items-center">
            <p className="text-sm text-gray-500">
              {new Date(photo.createdAt).toLocaleDateString("ko-KR")}
            </p>
            <div className="flex items-center gap-3">
              <p className="text-sm">❤️ {photo.likeCount}</p>
              <button onClick={onClose} className="text-gray-500 text-xl">✕</button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <p className="text-sm text-gray-400">댓글 준비 중...</p>
          </div>
        </div>
      </div>
    </div>
  );
}
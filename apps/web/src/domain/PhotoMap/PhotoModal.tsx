"use client";

import Image from "next/image";
import { Icon } from "@/components/icons";
import type { PhotoLocation } from "@/lib/api/photos";

interface Props {
  photo: PhotoLocation;
  onClose: () => void;
}

function formatTakenAt(takenAt: string | null, createdAt: string): string {
  const d = new Date(takenAt ?? createdAt);
  return d.toLocaleString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// PR #226 Place log Storybook의 PhotoModal 디자인 적용.
// 어두운 백드롭 + 상단 캡션·닫기 + 본문 큰 이미지 + 하단 좋아요 카드.
export function PhotoModal({ photo, onClose }: Props) {
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-black/80"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      {/* header */}
      <div
        className="flex shrink-0 items-center justify-between px-4 py-3"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col">
          <span className="text-[15px] font-bold text-white">
            {formatTakenAt(photo.takenAt, photo.createdAt)}
          </span>
        </div>
        <button
          type="button"
          aria-label="사진 닫기"
          onClick={onClose}
          className="flex size-10 items-center justify-center rounded-full bg-white shadow-lg transition-opacity active:opacity-70"
        >
          <Icon name="close" size="md" color="default" decorative />
        </button>
      </div>

      {/* 확대 사진 */}
      <div
        className="relative min-h-0 flex-1"
        onClick={(e) => e.stopPropagation()}
      >
        <Image
          src={photo.url}
          alt=""
          fill
          className="object-contain"
          sizes="(max-width: 480px) 100vw, 480px"
        />
      </div>

      {/* footer — 좋아요 */}
      <div
        className="shrink-0 px-4 py-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="rounded-2xl bg-white/10 p-3 backdrop-blur-sm">
          <div className="flex items-center gap-1">
            <Icon name="heart" size="xs" color="inverse" decorative />
            <span className="text-[12px] font-medium text-white">{photo.likeCount}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

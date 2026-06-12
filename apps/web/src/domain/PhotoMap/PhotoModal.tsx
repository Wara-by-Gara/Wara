"use client";

import Image from "next/image";
import { Icon } from "@/components/icons";
import type { PhotoLocation } from "@/lib/api/photos";

interface Props {
  photo: PhotoLocation;
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
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

export function PhotoModal({ photo, onClose, onPrev, onNext }: Props) {
  const address = (photo.exifMetadata as Record<string, unknown> | null)?.gps_address as string | undefined;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-black/90"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      {/* 헤더 */}
      <div
        className="flex shrink-0 items-center justify-between px-4 pb-2 pt-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col">
          {address && (
            <span className="text-[16px] font-bold text-white">{address}</span>
          )}
          <span className={address ? "text-[12px] text-white/60" : "text-[15px] font-bold text-white"}>
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

      {/* 확대 사진 + 이전/다음 버튼 */}
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
          priority
        />
        {onPrev && (
          <button
            type="button"
            aria-label="이전 사진"
            onClick={(e) => { e.stopPropagation(); onPrev(); }}
            className="absolute left-3 top-1/2 -translate-y-1/2 flex size-10 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm active:opacity-70"
          >
            <Icon name="chevron-left" size="md" color="inverse" decorative />
          </button>
        )}
        {onNext && (
          <button
            type="button"
            aria-label="다음 사진"
            onClick={(e) => { e.stopPropagation(); onNext(); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 flex size-10 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm active:opacity-70"
          >
            <Icon name="chevron-right" size="md" color="inverse" decorative />
          </button>
        )}
      </div>

      {/* 푸터 */}
      <div
        className="shrink-0 px-4 pb-6 pt-3"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="rounded-2xl bg-white/10 p-4 backdrop-blur-md ring-1 ring-white/20">
          {address && (
            <>
              <div className="flex items-start gap-2.5">
                <Icon name="map-pin" size="sm" color="inverse" decorative />
                <p className="flex-1 text-[14px] font-semibold text-white">{address}</p>
              </div>
              <div className="my-3 h-px bg-white/10" />
            </>
          )}
          <div className="flex items-center gap-1.5">
            <Icon name="heart" size="sm" color="inverse" decorative />
            <span className="text-[13px] font-medium text-white">{photo.likeCount}</span>
            <span className="text-[12px] text-white/50">명이 좋아해요</span>
          </div>
        </div>
      </div>
    </div>
  );
}

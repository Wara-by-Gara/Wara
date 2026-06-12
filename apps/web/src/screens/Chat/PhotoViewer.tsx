"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Icon } from "@/components/icons";
import { toast } from "@/components/molecules/Toast";

export type ViewerPhoto = {
  imageUrl: string;
  uploaderName: string | null;
  createdAt: string;
};

function filenameFromUrl(url: string) {
  try {
    const name = new URL(url).pathname.split("/").pop();
    return name && name.includes(".") ? name : "photo.jpg";
  } catch {
    return "photo.jpg";
  }
}

function formatUploaded(createdAt: string) {
  return new Date(createdAt).toLocaleString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// 사진 크게 보기 — 좌우 슬라이드 + 업로더/시간 + 다운로드 (채팅 메시지 / 갤러리 공용)
export function PhotoViewer({
  photos,
  startIndex,
  onClose,
}: {
  photos: ViewerPhoto[] | null;
  startIndex: number;
  onClose: () => void;
}) {
  const [cur, setCur] = useState(startIndex);
  const touchX = useRef<number | null>(null);

  // 열릴 때 시작 인덱스로 초기화
  useEffect(() => {
    setCur(startIndex);
  }, [startIndex, photos]);

  const total = photos?.length ?? 0;
  const prev = () => setCur((c) => Math.max(0, c - 1));
  const next = () => setCur((c) => Math.min(total - 1, c + 1));

  useEffect(() => {
    if (!photos) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photos, total]);

  if (!photos || total === 0) return null;
  const safe = Math.min(Math.max(cur, 0), total - 1);
  const photo = photos[safe]!;

  const handleDownload = async () => {
    try {
      const res = await fetch(photo.imageUrl);
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = filenameFromUrl(photo.imageUrl);
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objectUrl);
    } catch {
      toast.error("사진을 저장하지 못했어요");
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[60] flex flex-col bg-black/95">
      {/* 상단 바: 좌 닫기(<) · 가운데 업로더/시간 · 우 저장 */}
      <div className="flex items-center gap-2 p-2 pt-[calc(0.5rem+env(safe-area-inset-top))]">
        <button
          type="button"
          aria-label="닫기"
          onClick={onClose}
          className="flex size-10 shrink-0 items-center justify-center rounded-full text-white active:opacity-70"
        >
          <Icon name="chevron-left" size="lg" color="currentColor" decorative />
        </button>
        <div className="min-w-0 flex-1 text-center text-white">
          <p className="truncate text-[14px] font-bold">
            {photo.uploaderName ?? "사용자"}
          </p>
          <p className="truncate text-[11px] text-white/70">
            {formatUploaded(photo.createdAt)}
          </p>
        </div>
        <button
          type="button"
          aria-label="사진 저장"
          onClick={handleDownload}
          className="flex size-10 shrink-0 items-center justify-center rounded-full text-white active:opacity-70"
        >
          <Icon name="download" size="lg" color="currentColor" decorative />
        </button>
      </div>

      {/* 이미지 영역 — 좌우 스와이프/화살표로 이동 */}
      <div
        className="relative flex flex-1 items-center justify-center overflow-hidden"
        onTouchStart={(e) => {
          touchX.current = e.touches[0]?.clientX ?? null;
        }}
        onTouchEnd={(e) => {
          if (touchX.current == null) return;
          const dx = (e.changedTouches[0]?.clientX ?? 0) - touchX.current;
          if (dx > 50) prev();
          else if (dx < -50) next();
          touchX.current = null;
        }}
        onClick={onClose}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photo.imageUrl}
          alt="사진 크게 보기"
          className="max-h-full max-w-full object-contain"
          onClick={(e) => e.stopPropagation()}
        />

        {total > 1 && safe > 0 && (
          <button
            type="button"
            aria-label="이전 사진"
            onClick={(e) => {
              e.stopPropagation();
              prev();
            }}
            className="absolute left-1 flex size-10 items-center justify-center rounded-full bg-black/40 text-white active:opacity-70"
          >
            <Icon name="chevron-left" size="lg" color="currentColor" decorative />
          </button>
        )}
        {total > 1 && safe < total - 1 && (
          <button
            type="button"
            aria-label="다음 사진"
            onClick={(e) => {
              e.stopPropagation();
              next();
            }}
            className="absolute right-1 flex size-10 items-center justify-center rounded-full bg-black/40 text-white active:opacity-70"
          >
            <Icon name="chevron-right" size="lg" color="currentColor" decorative />
          </button>
        )}
      </div>

      {total > 1 && (
        <p className="pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-2 text-center text-[12px] text-white/70">
          {safe + 1} / {total}
        </p>
      )}
    </div>,
    document.body,
  );
}

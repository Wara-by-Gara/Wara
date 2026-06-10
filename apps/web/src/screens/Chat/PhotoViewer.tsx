"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { Icon } from "@/components/icons";
import { toast } from "@/components/molecules/Toast";

// presigned URL 경로 끝의 파일명 추출 (쿼리 제외), 실패 시 기본값
function filenameFromUrl(url: string) {
  try {
    const name = new URL(url).pathname.split("/").pop();
    return name && name.includes(".") ? name : "photo.jpg";
  } catch {
    return "photo.jpg";
  }
}

// 사진 크게 보기 + 다운로드 (채팅 사진 메시지 / 갤러리 공용)
export function PhotoViewer({
  url,
  onClose,
}: {
  url: string | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!url) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [url, onClose]);

  if (!url) return null;

  // presigned URL은 교차 출처라 <a download>가 무시됨 -> blob으로 받아 강제 저장
  const handleDownload = async () => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = filenameFromUrl(url);
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objectUrl);
    } catch {
      toast.error("사진을 저장하지 못했어요");
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[60] flex flex-col bg-black/95" onClick={onClose}>
      <div
        className="flex items-center justify-end gap-1 p-3 pt-[calc(0.75rem+env(safe-area-inset-top))]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          aria-label="사진 저장"
          onClick={handleDownload}
          className="flex size-10 items-center justify-center rounded-full text-white active:opacity-70"
        >
          <Icon name="download" size="lg" color="currentColor" decorative />
        </button>
        <button
          type="button"
          aria-label="닫기"
          onClick={onClose}
          className="flex size-10 items-center justify-center rounded-full text-white active:opacity-70"
        >
          <Icon name="x" size="lg" color="currentColor" decorative />
        </button>
      </div>
      <div className="flex flex-1 items-center justify-center overflow-hidden p-4">
        {/* presigned URL은 만료·쿼리파라미터라 next/image 부적합 (기존 사진 기능 관례) */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt="사진 크게 보기"
          className="max-h-full max-w-full object-contain"
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    </div>,
    document.body,
  );
}

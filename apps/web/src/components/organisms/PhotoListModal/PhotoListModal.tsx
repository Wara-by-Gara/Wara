"use client";

import { useState } from "react";
import { Icon } from "@/components/icons";
import { Button } from "@/components/primitives/Button";
import { PhotoGrid } from "@/components/organisms/PhotoGrid";
import { PhotoGridItem } from "@/components/organisms/PhotoGridItem";
import { PhotoViewer } from "@/components/organisms/PhotoViewer";
import { Modal, ModalOverlay, ModalPortal, ModalPrimitive } from "@/components/molecules/Modal";
import { cn } from "@/lib/cn";
import type { PhotoViewerComment } from "@/components/organisms/PhotoViewer";

export interface PhotoListModalPhoto {
  id: string;
  src?: string;
  alt?: string;
  authorName?: string;
  authorAvatarUrl?: string;
  createdAt?: string;
  likeCount?: number;
  liked?: boolean;
  comments?: PhotoViewerComment[];
}

export interface PhotoListModalProps {
  /** 모달 열림 */
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** 제목 (예: "전체 사진 12장") */
  title?: string;
  photos?: PhotoListModalPhoto[];
  /** Storybook 베젤 등 부모(relative) 안에 맞출 때 */
  contained?: boolean;
  onPhotoLike?: (photoId: string) => void;
  onCommentSubmit?: (photoId: string, text: string) => void;
  /** 선택 다운로드 콜백 */
  onSelectDownload?: (photoIds: string[]) => void;
  /** 전체 다운로드 콜백 */
  onDownloadAll?: (photoIds: string[]) => void;
  /** 사진 클릭 시 외부에서 처리할 콜백 (없으면 내부 뷰어 사용) */
  onPhotoClick?: (idx: number, photoId: string) => void;
}

export const PhotoListModal = ({
  open,
  onOpenChange,
  title,
  photos = [],
  contained = false,
  onPhotoLike,
  onCommentSubmit,
  onSelectDownload,
  onDownloadAll,
  onPhotoClick,
}: PhotoListModalProps) => {
  const [viewingIndex, setViewingIndex] = useState<number | null>(null);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectDownload = () => {
    if (!selectMode) {
      setSelectMode(true);
      return;
    }
    if (selectedIds.size === 0) return;
    onSelectDownload?.(Array.from(selectedIds));
    setSelectMode(false);
    setSelectedIds(new Set());
  };

  const handleDownloadAll = () => {
    onDownloadAll?.(photos.map((p) => p.id));
  };

  const handlePhotoClick = (idx: number, photoId: string) => {
    if (selectMode) { toggleSelect(photoId); return; }
    if (onPhotoClick) { onPhotoClick(idx, photoId); }
    else { setViewingIndex(idx); }
  };

  const viewingPhoto = viewingIndex !== null ? photos[viewingIndex] : null;

  const overlayClass = cn(
    "z-50 bg-black/60 data-[state=open]:animate-in data-[state=open]:fade-in",
    contained ? "absolute inset-0" : "fixed inset-0",
  );
  const contentClass = cn(
    "z-50 flex flex-col overflow-hidden rounded-3xl bg-surface shadow-xl focus:outline-none",
    "data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:zoom-in-95",
    contained
      ? "absolute inset-x-4 bottom-4 top-16 max-h-[80%]"
      : "fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100vw-32px)] max-w-md max-h-[80vh]",
  );

  const modalBody = (
    <>
      <ModalOverlay className={overlayClass} />
      <ModalPrimitive.Content className={contentClass} aria-describedby={undefined}>
        {/* 헤더 */}
        <div className="flex shrink-0 items-center justify-between border-b border-border px-5 py-4">
          <ModalPrimitive.Title className="text-[17px] font-bold text-text-primary">
            {selectMode
              ? selectedIds.size > 0
                ? `${selectedIds.size}장 선택됨`
                : "사진을 선택하세요"
              : (title ?? `전체 사진 ${photos.length}장`)}
          </ModalPrimitive.Title>
          <button
            type="button"
            onClick={() => {
              if (selectMode) {
                setSelectMode(false);
                setSelectedIds(new Set());
              } else {
                onOpenChange(false);
              }
            }}
            aria-label={selectMode ? "선택 취소" : "닫기"}
            className="inline-flex size-8 items-center justify-center rounded-full text-text-secondary hover:bg-gray-100"
          >
            <Icon name="x" size="md" color="currentColor" decorative />
          </button>
        </div>

        {/* 사진 그리드 */}
        <div className="flex-1 overflow-y-auto px-3 py-3">
          {photos.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-text-tertiary">
              <Icon name="retro-camera" size="xl" color="inactive" decorative />
              <p className="text-[14px]">사진이 없어요</p>
            </div>
          ) : (
            <PhotoGrid columns={3} selectMode={selectMode}>
              {photos.map((photo, idx) => (
                <PhotoGridItem
                  key={photo.id}
                  src={photo.src}
                  alt={photo.alt ?? ""}
                  hostManageMode={selectMode}
                  status={selectedIds.has(photo.id) ? "selected" : "default"}
                  onClick={() => handlePhotoClick(idx, photo.id)}
                />
              ))}
            </PhotoGrid>
          )}
        </div>

        {/* 하단 액션 바 */}
        {photos.length > 0 ? (
          <div className="shrink-0 border-t border-border px-4 py-3">
            <div className="flex gap-2">
              <Button
                variant="outline"
                fullWidth
                onClick={handleSelectDownload}
                className={cn(selectMode && selectedIds.size > 0 && "border-primary text-primary")}
              >
                {selectMode
                  ? selectedIds.size > 0
                    ? `${selectedIds.size}장 다운`
                    : "선택 취소"
                  : "선택 다운"}
              </Button>
              <Button
                fullWidth
                onClick={handleDownloadAll}
              >
                <Icon name="download" size="sm" color="currentColor" decorative />
                전체 다운
              </Button>
            </div>
          </div>
        ) : null}

        {/* 개별 사진 뷰어 */}
        {viewingPhoto ? (
          <PhotoViewer
            open
            contained
            src={viewingPhoto.src}
            authorName={viewingPhoto.authorName}
            authorAvatarUrl={viewingPhoto.authorAvatarUrl}
            createdAt={viewingPhoto.createdAt}
            likeCount={viewingPhoto.likeCount ?? 0}
            liked={viewingPhoto.liked ?? false}
            commentCount={viewingPhoto.comments?.length ?? 0}
            comments={viewingPhoto.comments ?? []}
            onClose={() => setViewingIndex(null)}
            onLike={() => onPhotoLike?.(viewingPhoto.id)}
            onCommentSubmit={(text) => onCommentSubmit?.(viewingPhoto.id, text)}
          />
        ) : null}
      </ModalPrimitive.Content>
    </>
  );

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      {contained ? modalBody : <ModalPortal>{modalBody}</ModalPortal>}
    </Modal>
  );
};

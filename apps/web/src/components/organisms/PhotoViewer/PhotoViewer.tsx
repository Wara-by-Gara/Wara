"use client";

import { forwardRef, type ReactNode } from "react";
import { Icon } from "@/components/icons";
import { Avatar } from "@/components/primitives/Avatar";
import { IconButton } from "@/components/primitives/IconButton";
import { cn } from "@/lib/cn";

export interface PhotoViewerProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  authorName?: string;
  authorAvatarUrl?: string;
  createdAt?: string;
  /** 보기 모드 */
  variant?: "default" | "owner" | "host" | "loading" | "error";
  onClose?: () => void;
  onSave?: () => void;
  onShare?: () => void;
  onMore?: () => void;
  /** 추가 액션 슬롯 */
  rightActions?: ReactNode;
}

export const PhotoViewer = forwardRef<HTMLDivElement, PhotoViewerProps>(
  function PhotoViewer(
    {
      className,
      src,
      alt,
      authorName,
      authorAvatarUrl,
      createdAt,
      variant = "default",
      onClose,
      onSave,
      onShare,
      onMore,
      rightActions,
      ...props
    },
    ref,
  ) {
    return (
      <div
        ref={ref}
        className={cn(
          "relative flex aspect-[9/16] w-full max-w-md flex-col overflow-hidden bg-black text-text-inverse",
          className,
        )}
        {...props}
      >
        {/* Top bar */}
        <header className="absolute inset-x-0 top-0 z-10 flex items-center justify-between p-3">
          <IconButton
            icon="x"
            variant="ghost"
            aria-label="닫기"
            onClick={onClose}
            className="bg-black/40 text-white hover:bg-black/60"
          />
          <div className="flex items-center gap-1">
            {onSave ? (
              <IconButton icon="download" variant="ghost" aria-label="저장" onClick={onSave} className="text-white" />
            ) : null}
            {onShare ? (
              <IconButton icon="share" variant="ghost" aria-label="공유" onClick={onShare} className="text-white" />
            ) : null}
            {(variant === "owner" || variant === "host") && onMore ? (
              <IconButton
                icon="more-horizontal"
                variant="ghost"
                aria-label="더보기"
                onClick={onMore}
                className="text-white"
              />
            ) : null}
            {rightActions}
          </div>
        </header>

        {/* Image */}
        {variant === "loading" ? (
          <div className="flex flex-1 items-center justify-center">
            <span className="size-8 animate-spin rounded-full border-2 border-current border-r-transparent" />
          </div>
        ) : variant === "error" ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
            <Icon name="alert-triangle" size="xl" color="currentColor" decorative />
            <p className="text-sm">사진을 불러오지 못했어요</p>
          </div>
        ) : src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={alt ?? ""} className="size-full object-contain" />
        ) : null}

        {/* Author footer */}
        {authorName ? (
          <footer className="absolute inset-x-0 bottom-0 z-10 flex items-center gap-2 bg-gradient-to-t from-black/70 to-transparent p-4">
            <Avatar src={authorAvatarUrl} alt={authorName} size="sm" initial={authorName?.[0]} />
            <div className="flex flex-col">
              <span className="text-[14px] font-semibold">{authorName}</span>
              {createdAt ? (
                <span className="text-[12px] opacity-80">{createdAt}</span>
              ) : null}
            </div>
          </footer>
        ) : null}
      </div>
    );
  },
);

"use client";

import { forwardRef } from "react";
import { Heart } from "lucide-react";
import { Icon } from "@/components/icons";
import { cn } from "@/lib/cn";

export type PhotoStatus = "default" | "uploading" | "failed" | "selected" | "video";

export interface PhotoGridItemProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "type"> {
  src?: string;
  /** 알트 텍스트 */
  alt?: string;
  /** 사진 상태 */
  status?: PhotoStatus;
  /** 업로드 진행률 (0-100, status=uploading 일 때) */
  progress?: number;
  /** 본인 사진 */
  isOwner?: boolean;
  /** 호스트 관리 모드 */
  hostManageMode?: boolean;
  /** 남은 사진 수 등 (+18) */
  overflowLabel?: string;
  /** 좋아요 수 표시 */
  likeCount?: number;
  /** 좋아요 여부 */
  liked?: boolean;
  /** 좋아요 토글 콜백 */
  onLike?: () => void;
}

export const PhotoGridItem = forwardRef<HTMLButtonElement, PhotoGridItemProps>(
  function PhotoGridItem(
    { className, src, alt, status = "default", progress = 0, isOwner, hostManageMode, overflowLabel, likeCount, liked, onLike, ...props },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type="button"
        aria-pressed={status === "selected" || hostManageMode}
        className={cn(
          "group relative aspect-square w-full overflow-hidden rounded-sm bg-gray-100",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
          status === "selected" && "ring-4 ring-primary",
          className,
        )}
        {...props}
      >
        {overflowLabel ? (
          <span className="flex size-full items-center justify-center bg-gray-200 text-[17px] font-semibold text-text-secondary">
            {overflowLabel}
          </span>
        ) : src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={alt ?? ""} className="size-full object-cover" />
        ) : null}

        {/* Video badge */}
        {status === "video" ? (
          <span className="absolute right-1.5 top-1.5 inline-flex items-center gap-0.5 rounded-xs bg-black/55 px-1.5 py-0.5 text-[11px] font-semibold text-white">
            <Icon name="camera" size="xs" color="currentColor" decorative /> 영상
          </span>
        ) : null}

        {/* Uploading overlay */}
        {status === "uploading" ? (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-text-inverse">
            <span className="size-5 animate-spin rounded-full border-2 border-current border-r-transparent" />
          </div>
        ) : null}

        {/* Failed overlay */}
        {status === "failed" ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-danger/85 text-text-inverse">
            <Icon name="alert-circle" size="md" color="currentColor" decorative />
            <span className="text-[11px] font-semibold">실패</span>
          </div>
        ) : null}

        {/* Owner indicator */}
        {isOwner && !hostManageMode ? (
          <span className="absolute left-1.5 top-1.5 rounded-full bg-primary px-1.5 text-[10px] font-semibold text-text-inverse">
            나
          </span>
        ) : null}

        {/* Like count overlay */}
        {(likeCount !== undefined || onLike) && !overflowLabel ? (
          <span
            className={cn(
              "absolute bottom-1 right-1 inline-flex items-center gap-1 rounded-xs bg-black/50 px-1.5 py-0.5 text-[11px] font-semibold",
              liked ? "text-brand" : "text-white hover:text-brand",
              onLike && "cursor-pointer",
            )}
            onClick={onLike ? (e) => { e.stopPropagation(); onLike(); } : undefined}
            role={onLike ? "button" : undefined}
            aria-label={onLike ? (liked ? "좋아요 취소" : "좋아요") : undefined}
          >
            {liked ? (
              <Heart className="size-3.5 shrink-0 fill-current" aria-hidden />
            ) : (
              <Heart className="size-3.5 shrink-0" aria-hidden />
            )}
            {likeCount ?? 0}
          </span>
        ) : null}

        {/* Host manage checkbox */}
        {hostManageMode ? (
          <span
            className={cn(
              "absolute left-1.5 top-1.5 inline-flex size-5 items-center justify-center rounded-full border-2 border-white",
              status === "selected" && "bg-primary border-primary",
            )}
          >
            {status === "selected" ? (
              <Icon name="check" size="xs" color="inverse" decorative />
            ) : null}
          </span>
        ) : null}
      </button>
    );
  },
);

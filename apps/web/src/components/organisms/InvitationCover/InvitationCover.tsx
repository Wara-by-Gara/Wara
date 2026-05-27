"use client";

import { forwardRef, type ReactNode } from "react";
import { Icon } from "@/components/icons";
import { Badge } from "@/components/primitives/Badge";
import { IconButton } from "@/components/primitives/IconButton";
import { cn } from "@/lib/cn";

export interface InvitationCoverProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 표지 모드 */
  variant?: "image" | "color" | "template" | "no-image";
  /** 이미지 URL (image / template) */
  imageUrl?: string;
  /** 배경 클래스 (color) */
  backgroundClass?: string;
  /** D-day 배지 텍스트 (예: 'D-3', 'TODAY') */
  ddayLabel?: string;
  /** 호스트 모드 — 우상단 더보기 버튼 */
  isHost?: boolean;
  /** 우상단 공유 콜백 */
  onShare?: () => void;
  /** 우상단 더보기 콜백 (host) */
  onMore?: () => void;
  /** 좌상단 뒤로가기 */
  onBack?: () => void;
  /** 표지 내부 children (제목 등) */
  children?: ReactNode;
  /** 하단 검정 그라데이션 숨김 */
  hideBottomGradient?: boolean;
}

const containerBase =
  "relative overflow-hidden rounded-3xl aspect-[4/5] min-h-72";

export const InvitationCover = forwardRef<HTMLDivElement, InvitationCoverProps>(
  function InvitationCover(
    {
      className,
      variant = "image",
      imageUrl,
      backgroundClass,
      ddayLabel,
      isHost,
      onShare,
      onMore,
      onBack,
      children,
      hideBottomGradient = false,
      ...props
    },
    ref,
  ) {
    return (
      <div
        ref={ref}
        className={cn(
          containerBase,
          variant === "color" && (backgroundClass ?? "bg-white"),
          variant === "no-image" && "bg-gray-100",
          className,
        )}
        {...props}
      >
        {(variant === "image" || variant === "template") && imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt=""
            className="absolute inset-0 size-full object-cover"
          />
        ) : null}

        {variant === "no-image" && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Icon name="ticket" size="xl" color="inactive" decorative />
          </div>
        )}

        {/* Gradient overlay */}
        {!hideBottomGradient && (variant === "image" || variant === "template") ? (
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/55 to-transparent" />
        ) : null}

        {/* Top bar */}
        <div className="absolute inset-x-0 top-0 flex items-center justify-between p-3">
          {onBack ? (
            <IconButton
              icon="chevron-left"
              variant="filled"
              size="sm"
              aria-label="뒤로가기"
              onClick={onBack}
              className="bg-black/40 text-white hover:bg-black/60"
            />
          ) : (
            <span />
          )}
          <div className="flex items-center gap-1">
            {onShare ? (
              <IconButton
                icon="share"
                variant="filled"
                size="sm"
                aria-label="공유"
                onClick={onShare}
                className="bg-black/40 text-white hover:bg-black/60"
              />
            ) : null}
            {isHost && onMore ? (
              <IconButton
                icon="more-horizontal"
                variant="filled"
                size="sm"
                aria-label="더보기"
                onClick={onMore}
                className="bg-black/40 text-white hover:bg-black/60"
              />
            ) : null}
          </div>
        </div>

        {/* D-day */}
        {ddayLabel ? (
          <div className="absolute left-3 top-3">
            <Badge variant="dday" size="md">
              {ddayLabel}
            </Badge>
          </div>
        ) : null}

        {/* Content */}
        {children ? (
          <div className="absolute inset-x-0 bottom-0 p-5 text-text-inverse">
            {children}
          </div>
        ) : null}
      </div>
    );
  },
);

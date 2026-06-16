"use client";

import { forwardRef, type ReactNode } from "react";
import Image from "next/image";
import { Badge, Icon, IconButton } from "@wara/ui";
import { cn } from "@/lib/cn";

export interface InvitationCoverProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 표지 모드 */
  variant?: "image" | "color" | "template" | "no-image";
  /** 이미지 URL (image / template) */
  imageUrl?: string;
  /** GIF URL (Klipy CDN) */
  gifUrl?: string;
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
  /** 이미지/GIF 원본 비율에 맞춰 높이 가변(1.91:1~3:4 clamp). 상세 페이지 전용 */
  fitToImage?: boolean;
  /** 초대장 상세 — 최대 1:1, rounded-lg (8px) */
  detailMode?: boolean;
}

const containerBase =
  "relative overflow-hidden rounded-lg aspect-[4/5] min-h-72";

export const InvitationCover = forwardRef<HTMLDivElement, InvitationCoverProps>(
  function InvitationCover(
    {
      className,
      variant = "image",
      imageUrl,
      gifUrl,
      backgroundClass,
      ddayLabel,
      isHost,
      onShare,
      onMore,
      onBack,
      children,
      hideBottomGradient = false,
      fitToImage = false,
      detailMode = false,
      ...props
    },
    ref,
  ) {
    const mediaUrl =
      gifUrl ??
      ((variant === "image" || variant === "template") && imageUrl ? imageUrl : undefined);
    const fit = detailMode || (fitToImage && !!mediaUrl);
    const hasCoverMedia = !!(mediaUrl || gifUrl);
    const showBottomGradient =
      hasCoverMedia &&
      !hideBottomGradient &&
      (variant === "image" || variant === "template");

    return (
      <div
        ref={ref}
        className={cn(
          fit
            ? cn("relative w-full overflow-hidden rounded-lg aspect-[3/2]")
            : containerBase,
          !fit && variant === "color" && (backgroundClass ?? "bg-white"),
          !fit && variant === "no-image" && "bg-gray-100",
          fit && variant === "color" && (backgroundClass ?? "bg-white"),
          fit && variant === "no-image" && "bg-gray-100",
          className,
        )}
        {...props}
      >
        {fit && mediaUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={mediaUrl}
            alt=""
            className="absolute inset-0 size-full object-cover"
          />
        ) : gifUrl ? (
          <Image
            src={gifUrl}
            alt=""
            fill
            unoptimized
            className="object-cover"
          />
        ) : (variant === "image" || variant === "template") && imageUrl ? (
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
        {showBottomGradient ? (
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/55 to-transparent" />
        ) : null}

        {/* Top bar */}
        <div className="absolute inset-x-0 top-0 flex items-center justify-between p-3">
          {onBack ? (
            <IconButton
              icon="chevron-left"
              variant="primary"
              size="sm"
              label="뒤로가기"
              onClick={onBack}
              className="bg-black/40 text-white hover:bg-black/50 transition-colors duration-150"
            />
          ) : (
            <span />
          )}
          <div className="flex items-center gap-1">
            {onShare ? (
              <IconButton
                icon="share"
                variant="primary"
                size="sm"
                label="공유"
                onClick={onShare}
                className="bg-black/40 text-white hover:bg-black/50 transition-colors duration-150"
              />
            ) : null}
            {isHost && onMore ? (
              <IconButton
                icon="more-horizontal"
                variant="primary"
                size="sm"
                label="더보기"
                onClick={onMore}
                className="bg-black/40 text-white hover:bg-black/50 transition-colors duration-150"
              />
            ) : null}
          </div>
        </div>

        {/* D-day */}
        {ddayLabel ? (
          <div className="absolute left-3 top-3">
            <Badge tone="danger" size="md">
              {ddayLabel}
            </Badge>
          </div>
        ) : null}

        {/* Content */}
        {children ? (
          <div
            className={cn(
              "absolute inset-x-0 bottom-0 p-5",
              hasCoverMedia ? "text-text-inverse" : "text-text",
            )}
          >
            {children}
          </div>
        ) : null}
      </div>
    );
  },
);

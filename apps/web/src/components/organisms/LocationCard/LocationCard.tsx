"use client";

import { forwardRef } from "react";
import { Icon } from "@/components/icons";
import { Button } from "@/components/primitives/Button";
import { toast } from "@/components/molecules/Toast";
import { cn } from "@/lib/cn";

export interface LocationCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 카드 모드 */
  variant?: "preview" | "selected" | "online" | "unknown";
  /** 장소명 */
  placeName?: string;
  /** 주소 */
  address?: string;
  /** 지도 미리보기 이미지 URL */
  mapPreviewUrl?: string;
  /** 온라인 모임 링크 (online 모드) */
  onlineLink?: string;
  /** 지도에서 보기 콜백 (preview 모드) */
  onViewMap?: () => void;
  /** 길찾기 콜백 */
  onGetDirections?: () => void;
}

async function copyToClipboard(text: string, successMessage: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.show(successMessage);
  } catch {
    toast.error("복사에 실패했어요");
  }
}

export const LocationCard = forwardRef<HTMLDivElement, LocationCardProps>(
  function LocationCard(
    {
      className,
      variant = "preview",
      placeName,
      address,
      mapPreviewUrl,
      onlineLink,
      onViewMap,
      onGetDirections,
      ...props
    },
    ref,
  ) {
    if (variant === "unknown") {
      return (
        <div
          ref={ref}
          className={cn(
            "flex flex-col gap-2 rounded-3xl border border-dashed border-border-strong bg-gray-50 p-5 text-center",
            className,
          )}
          {...props}
        >
          <Icon name="map-pin" size="lg" color="inactive" decorative className="mx-auto" />
          <p className="text-[15px] font-semibold text-text-primary">장소가 아직 정해지지 않았어요</p>
          <p className="text-[13px] text-text-tertiary">호스트가 장소를 정하면 알려드릴게요</p>
        </div>
      );
    }

    if (variant === "online") {
      return (
        <div
          ref={ref}
          className={cn(
            "flex items-center gap-3 rounded-3xl border border-border bg-surface p-4",
            className,
          )}
          {...props}
        >
          <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-2xl bg-sky-100 text-sky-500">
            <Icon name="globe" size="lg" color="currentColor" decorative />
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-[15px] font-semibold text-text-primary">온라인 모임</p>
            <p className="truncate text-[13px] text-text-secondary">{onlineLink}</p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onlineLink && copyToClipboard(onlineLink, "링크가 복사되었어요")}
          >
            복사
          </Button>
        </div>
      );
    }

    return (
      <div
        ref={ref}
        className={cn("flex flex-col gap-3 rounded-3xl border border-border bg-surface p-4", className)}
        {...props}
      >
        {mapPreviewUrl && (
          <div className="overflow-hidden rounded-2xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={mapPreviewUrl} alt={placeName ?? ""} className="aspect-[16/9] w-full object-cover" />
          </div>
        )}
        <div>
          <p className="text-[16px] font-bold text-text-primary">{placeName}</p>
          <p className="mt-0.5 text-[14px] text-text-secondary">
            {address}
            {address && (
              <>
                {" "}
                <button
                  type="button"
                  aria-label="주소 복사"
                  onClick={() => copyToClipboard(address, "주소가 복사되었어요")}
                  className="inline-flex align-middle rounded-md p-1 text-text-tertiary transition-colors hover:bg-gray-100 hover:text-text-primary"
                >
                  <Icon name="copy" size="sm" color="currentColor" decorative />
                </button>
              </>
            )}
          </p>
        </div>
        {(onViewMap || onGetDirections) && (
          <div className="flex gap-2">
            {onViewMap && (
              <Button variant="outline" size="sm" fullWidth onClick={onViewMap}>
                <Icon name="map" size="sm" decorative /> 지도에서 보기
              </Button>
            )}
            {onGetDirections && (
              <Button variant="primary" size="sm" fullWidth onClick={onGetDirections}>
                <Icon name="navigation" size="sm" color="inverse" decorative /> 길찾기
              </Button>
            )}
          </div>
        )}
      </div>
    );
  },
);

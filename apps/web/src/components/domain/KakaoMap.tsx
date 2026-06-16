"use client";

import Image from "next/image";
import { Button, Icon } from "@wara/ui";
import { cn } from "@/lib/cn";

export interface KakaoMapProps {
  /** 장소명 */
  placeName?: string;
  /** 주소 */
  address?: string;
  /** 정적 지도 이미지 URL (SDK 연동 전 미리보기). 없으면 플레이스홀더 */
  staticMapUrl?: string;
  /** 길찾기/지도 열기 콜백 */
  onOpen?: () => void;
  /** 지도 영역 높이 (기본 180px) */
  height?: number;
  className?: string;
}

/**
 * 카카오맵 표시용 래퍼 (presentational).
 * 실제 지도 SDK는 Phase 9 화면 마이그레이션에서 배선한다.
 * 지금은 staticMapUrl 또는 플레이스홀더 + 주소/길찾기 액션을 렌더.
 */
export function KakaoMap({
  placeName,
  address,
  staticMapUrl,
  onOpen,
  height = 180,
  className,
}: KakaoMapProps) {
  return (
    <div className={cn("overflow-hidden rounded-md border border-border bg-surface", className)}>
      <div className="relative w-full bg-surface-muted" style={{ height }}>
        {staticMapUrl ? (
          <Image src={staticMapUrl} alt={placeName ?? "지도"} fill unoptimized className="object-cover" sizes="100vw" />
        ) : (
          <div className="flex size-full flex-col items-center justify-center gap-1 text-text-disabled">
            <Icon name="map" size="xl" color="currentColor" decorative />
            <span className="type-caption">지도 미리보기</span>
          </div>
        )}
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-full text-accent drop-shadow">
          <Icon name="map-pin" size="lg" color="currentColor" decorative />
        </span>
      </div>

      {(placeName || address || onOpen) && (
        <div className="flex items-center gap-3 p-3">
          <div className="min-w-0 flex-1">
            {placeName ? <p className="truncate type-body font-semibold text-text">{placeName}</p> : null}
            {address ? <p className="truncate type-bodySmall text-text-muted">{address}</p> : null}
          </div>
          {onOpen ? (
            <Button size="sm" variant="secondary" onClick={onOpen}>
              <Icon name="navigation" size="sm" color="currentColor" decorative />
              길찾기
            </Button>
          ) : null}
        </div>
      )}
    </div>
  );
}

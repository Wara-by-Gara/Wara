"use client";

import { useEffect, useRef } from "react";
import { useKakaoMapsSdk } from "@/hooks/useKakaoMapsSdk";
import { cn } from "@/lib/cn";

type Props = {
  lat: number;
  lng: number;
  level?: number;
  className?: string;
  alt?: string;
  /** 16:9 비율 높이에서 줄일 px (초대장 상세 미리보기 등) */
  heightOffset?: number;
};

export function KakaoStaticMapPreview({
  lat,
  lng,
  level = 3,
  className,
  alt = "지도 미리보기",
  heightOffset = 0,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sdkReady = useKakaoMapsSdk();
  const useCompactHeight = heightOffset > 0;

  const latNum = Number(lat);
  const lngNum = Number(lng);
  const hasValidCoords = Number.isFinite(latNum) && Number.isFinite(lngNum);

  useEffect(() => {
    if (!sdkReady || !hasValidCoords || !window.kakao?.maps) return;

    let cancelled = false;
    let observer: ResizeObserver | null = null;

    const renderMap = () => {
      if (cancelled) return true;

      const el = containerRef.current;
      if (!el || !window.kakao?.maps) return false;
      if (el.clientWidth === 0 || el.clientHeight === 0) return false;

      const { maps } = window.kakao;
      const center = new maps.LatLng(latNum, lngNum);
      el.replaceChildren();
      new maps.StaticMap(el, {
        center,
        level,
        marker: { position: center },
      });
      return true;
    };

    if (!renderMap() && containerRef.current) {
      observer = new ResizeObserver(() => {
        if (renderMap()) observer?.disconnect();
      });
      observer.observe(containerRef.current);
    }

    return () => {
      cancelled = true;
      observer?.disconnect();
    };
  }, [sdkReady, hasValidCoords, latNum, lngNum, level]);

  const placeholderClass = useCompactHeight
    ? cn("relative w-full overflow-hidden bg-gray-100", className)
    : cn("aspect-[16/9] w-full bg-gray-100", className);

  const mapSurfaceClass = useCompactHeight
    ? "absolute inset-0 overflow-hidden bg-gray-100"
    : cn("aspect-[16/9] w-full overflow-hidden bg-gray-100", className);

  if (!hasValidCoords) {
    return useCompactHeight ? (
      <div
        className={placeholderClass}
        style={{ paddingBottom: `calc(56.25% - ${heightOffset}px)` }}
        aria-label={alt}
      />
    ) : (
      <div className={placeholderClass} aria-label={alt} />
    );
  }

  const mapNode = (
    <div ref={containerRef} className={mapSurfaceClass} aria-label={alt} />
  );

  if (useCompactHeight) {
    return (
      <div
        className={cn("relative w-full overflow-hidden", className)}
        style={{ paddingBottom: `calc(56.25% - ${heightOffset}px)` }}
      >
        {mapNode}
      </div>
    );
  }

  return mapNode;
}

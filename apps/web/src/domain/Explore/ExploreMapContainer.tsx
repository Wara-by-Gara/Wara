"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { StickyHeader } from "@/components/layout/StickyHeader";
import {
  KakaoMap,
  type MapBbox,
  type PhotoMarker,
} from "@/components/molecules/KakaoMap/KakaoMap";
import { MapLoadingSkeleton } from "@/components/organisms/Skeleton";
import { useKakaoMapsSdk } from "@/hooks/useKakaoMapsSdk";
import { getPublicMapInvitations } from "@/lib/api/invitations";
import { ROUTES } from "@/constants/routes";

// 서버 DTO의 bbox 상한과 동일 — 초과 시 BE 거부.
const MAX_BBOX_SPAN_DEG = 5;

function capBbox(bbox: MapBbox): MapBbox {
  const spanLat = bbox.neLat - bbox.swLat;
  const spanLng = bbox.neLng - bbox.swLng;
  if (spanLat <= MAX_BBOX_SPAN_DEG && spanLng <= MAX_BBOX_SPAN_DEG) return bbox;
  const cLat = (bbox.swLat + bbox.neLat) / 2;
  const cLng = (bbox.swLng + bbox.neLng) / 2;
  const half = MAX_BBOX_SPAN_DEG / 2;
  return {
    swLat: cLat - half,
    swLng: cLng - half,
    neLat: cLat + half,
    neLng: cLng + half,
  };
}

export default function ExploreMapContainer() {
  const router = useRouter();
  const sdkReady = useKakaoMapsSdk();
  const [bbox, setBbox] = useState<MapBbox | null>(null);

  const { data: markers = [] } = useQuery({
    queryKey: ["invitations", "explore-map", bbox],
    queryFn: () => getPublicMapInvitations(capBbox(bbox!)),
    enabled: bbox !== null,
    staleTime: 30_000,
  });

  // 공개 초대장 마커를 KakaoMap의 photoMarkers로 표현 — 둥근 썸네일 디자인 동일.
  // 클릭 시 초대장 상세로 라우팅.
  const photoMarkers: PhotoMarker[] = useMemo(
    () =>
      markers
        .filter((m) => m.mainImageThumbnailUrl)
        .map((m) => ({
          id: m.id,
          lat: m.lat,
          lng: m.lng,
          url: m.mainImageThumbnailUrl!,
          count: 1,
        })),
    [markers],
  );

  return (
    <div className="relative mx-auto flex h-full min-h-full w-full max-w-md flex-col bg-background">
      <StickyHeader title="탐색 지도" onBack={() => router.back()} />
      <main className="relative z-10 min-h-0 flex-1">
        <KakaoMap
          ready={sdkReady}
          photoMarkers={photoMarkers}
          onPhotoMarkerClick={(id) => router.push(ROUTES.INVITATIONS.DETAIL(id))}
          onBoundsChange={setBbox}
          autoFit="never"
          initialLevel={8}
          className="h-full w-full"
        />
        {!sdkReady && <MapLoadingSkeleton />}
      </main>
    </div>
  );
}

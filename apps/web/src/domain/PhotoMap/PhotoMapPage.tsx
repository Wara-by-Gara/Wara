"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import { useKakaoMapsSdk } from "@/hooks/useKakaoMapsSdk";
import { MapLoadingSkeleton } from "@/components/organisms/Skeleton";
import { KakaoMap, type PhotoMarker } from "@/components/molecules/KakaoMap/KakaoMap";
import { Icon } from "@/components/icons";
import { StickyHeader } from "@/components/layout/StickyHeader";
import { stickyMainTop } from "@/lib/mobilePageLayout";
import { getMyPhotoLocations, type PhotoLocation } from "@/lib/api/photos";
import { PhotoModal } from "./PhotoModal";
import { clusterPhotos, formatTakenAt } from "./photoMapUtils";

// ── 컴포넌트 ──────────────────────────────────────────────────────────────────
// PR #226 PlaceLog Storybook 디자인 — 헤더 + 지도(50vh) + 하단 사진 그리드 + PhotoModal.
export function PhotoMapPage() {
  const mapSdkReady = useKakaoMapsSdk();

  const [selectedPhoto, setSelectedPhoto] = useState<PhotoLocation | null>(null);

  const { data: photoLocations = [], isLoading } = useQuery({
    queryKey: ["photos", "locations"],
    queryFn: getMyPhotoLocations,
  });

  const clusters = useMemo(() => clusterPhotos(photoLocations), [photoLocations]);

  // 지도 핀은 클러스터링 결과로, 하단 그리드는 모든 사진을 최신순 정렬해 표시.
  const photoMarkers: PhotoMarker[] = clusters.map((c) => ({
    id: c.id,
    lat: c.lat,
    lng: c.lng,
    url: c.representativeUrl,
    count: c.count,
  }));

  const sortedPhotos = useMemo(
    () =>
      [...photoLocations].sort((a, b) => {
        const ta = new Date(a.takenAt ?? a.createdAt).getTime();
        const tb = new Date(b.takenAt ?? b.createdAt).getTime();
        return tb - ta;
      }),
    [photoLocations],
  );

  function handleMarkerClick(markerId: string) {
    const cluster = clusters.find((c) => c.id === markerId);
    if (!cluster) return;
    // 클러스터 대표 사진을 모달로 표시.
    setSelectedPhoto(cluster.photos[0] ?? null);
  }

  return (
    <div className="relative mx-auto flex h-full min-h-full w-full max-w-md flex-col bg-background">
      <StickyHeader title="Place log" />

      <main className={`relative z-10 min-h-0 flex-1 overflow-y-auto ${stickyMainTop}`}>
        {/* 헤더 카드 — 전체 사진 개수 */}
        <div className="flex items-center justify-between border-b border-border bg-surface px-page py-3">
          <span className="text-[14px] font-medium text-text-primary">내 사진</span>
          <span className="text-[12px] text-text-tertiary">
            사진 {photoLocations.length}장
          </span>
        </div>

        {/* 지도 — 50vh 고정 */}
        <div className="relative h-[50vh] w-full overflow-hidden">
          <KakaoMap
            ready={mapSdkReady}
            photoMarkers={photoMarkers}
            onPhotoMarkerClick={handleMarkerClick}
            autoFit="first"
            className="absolute inset-0"
          />
          {(isLoading || !mapSdkReady) && <MapLoadingSkeleton />}
        </div>

        {/* 하단 그리드 — 모든 사진 (지도 핀과 별개로 최신순) */}
        {!isLoading && mapSdkReady && (
          sortedPhotos.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-page py-12 text-center">
              <p className="text-[15px] font-bold text-text-primary">
                위치 정보가 있는 사진이 없어요
              </p>
              <p className="mt-1 text-[12px] text-text-secondary">
                GPS 정보가 담긴 사진을 업로드하면<br />여기서 확인할 수 있어요
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-0.5 p-0.5">
              {sortedPhotos.map((photo) => (
                <button
                  key={photo.id}
                  type="button"
                  onClick={() => setSelectedPhoto(photo)}
                  className="relative aspect-square overflow-hidden bg-gray-100 active:opacity-80"
                  aria-label={`사진 ${formatTakenAt(photo.takenAt, photo.createdAt)}`}
                >
                  <Image
                    src={photo.url}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="(max-width: 480px) 33vw, 160px"
                  />
                  {photo.likeCount > 0 && (
                    <div className="absolute bottom-1 right-1 flex items-center gap-0.5 rounded-full bg-black/60 px-1.5 py-0.5">
                      <Icon name="heart" size="xs" color="inverse" decorative />
                      <span className="text-[10px] font-medium text-white">{photo.likeCount}</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          )
        )}
      </main>

      {selectedPhoto && (
        <PhotoModal photo={selectedPhoto} onClose={() => setSelectedPhoto(null)} />
      )}
    </div>
  );
}

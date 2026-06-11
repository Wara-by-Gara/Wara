"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import { useKakaoMapsSdk } from "@/hooks/useKakaoMapsSdk";
import { MapLoadingSkeleton } from "@/components/organisms/Skeleton";
import { KakaoMap, type PhotoMarker } from "@/components/molecules/KakaoMap/KakaoMap";
import { Icon } from "@/components/icons";
import { getMyPhotoLocations, type PhotoLocation } from "@/lib/api/photos";
import { PhotoModal } from "@/domain/PhotoMap/PhotoModal";
import { clusterPhotos, formatTakenAt } from "@/domain/PhotoMap/photoMapUtils";

interface Props {
  onViewAll?: () => void;
}

export function PlaceLogPreview({ onViewAll }: Props) {
  const mapSdkReady = useKakaoMapsSdk();
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoLocation | null>(null);

  const { data: photoLocations = [], isLoading } = useQuery({
    queryKey: ["photos", "locations"],
    queryFn: getMyPhotoLocations,
  });

  const clusters = useMemo(() => clusterPhotos(photoLocations), [photoLocations]);

  const photoMarkers: PhotoMarker[] = clusters.map((c) => ({
    id: c.id,
    lat: c.lat,
    lng: c.lng,
    url: c.representativeUrl,
    count: c.count,
  }));

  const sortedPhotos = useMemo(
    () =>
      [...photoLocations]
        .sort((a, b) => {
          const ta = new Date(a.takenAt ?? a.createdAt).getTime();
          const tb = new Date(b.takenAt ?? b.createdAt).getTime();
          return tb - ta;
        })
        .slice(0, 5),
    [photoLocations],
  );

  function handleMarkerClick(markerId: string) {
    const cluster = clusters.find((c) => c.id === markerId);
    if (!cluster) return;
    setSelectedPhoto(cluster.photos[0] ?? null);
  }

  const isEmpty = !isLoading && mapSdkReady && photoLocations.length === 0;

  return (
    <>
      {/* 지도 */}
      <div className="relative h-[210px] overflow-hidden rounded-2xl ring-1 ring-border">
        <KakaoMap
          ready={mapSdkReady}
          photoMarkers={photoMarkers}
          onPhotoMarkerClick={handleMarkerClick}
          autoFit="first"
          className="absolute inset-0"
        />
        {(isLoading || !mapSdkReady) && <MapLoadingSkeleton />}
        {isEmpty && (
          <div className="absolute inset-0 flex items-center justify-center bg-background-soft">
            <p className="text-[13px] text-text-tertiary">위치 정보가 있는 사진이 없어요</p>
          </div>
        )}
      </div>

      {/* 사진 목록 */}
      {sortedPhotos.length > 0 && (
        <div className="mt-3 divide-y divide-border overflow-hidden rounded-2xl ring-1 ring-border">
          {sortedPhotos.map((photo) => (
            <button
              key={photo.id}
              type="button"
              onClick={() => setSelectedPhoto(photo)}
              className="flex w-full items-center gap-3 bg-surface px-3 py-2.5 text-left active:opacity-80"
            >
              <div className="relative size-14 shrink-0 overflow-hidden rounded-xl">
                <Image
                  src={photo.url}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="56px"
                />
              </div>
              <div className="min-w-0 flex-1">
                {photo.exifMetadata?.gps_address && (
                  <div className="flex items-center gap-1">
                    <Icon name="map-pin" size="xs" color="inactive" decorative />
                    <p className="truncate text-[12px] text-text-secondary">
                      {photo.exifMetadata.gps_address}
                    </p>
                  </div>
                )}
                <div className="mt-0.5 flex items-center gap-1">
                  <Icon name="clock" size="xs" color="inactive" decorative />
                  <span className="text-[11px] text-text-tertiary">
                    {formatTakenAt(photo.takenAt, photo.createdAt)}
                  </span>
                </div>
              </div>
              {photo.likeCount > 0 && (
                <div className="flex shrink-0 items-center gap-0.5">
                  <Icon name="heart" size="xs" color="inactive" decorative />
                  <span className="text-[11px] text-text-tertiary">{photo.likeCount}</span>
                </div>
              )}
            </button>
          ))}
          {photoLocations.length > 5 && (
            <button
              type="button"
              onClick={onViewAll}
              className="flex w-full items-center justify-center gap-1 bg-surface py-3 text-[12px] font-medium text-text-tertiary active:opacity-60"
            >
              전체 {photoLocations.length}장 보기
              <Icon name="chevron-right" size="xs" color="inactive" decorative />
            </button>
          )}
        </div>
      )}

      {selectedPhoto && (
        <PhotoModal photo={selectedPhoto} onClose={() => setSelectedPhoto(null)} />
      )}
    </>
  );
}

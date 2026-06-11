"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useKakaoMapsSdk } from "@/hooks/useKakaoMapsSdk";
import { MapLoadingSkeleton } from "@/components/organisms/Skeleton";
import { KakaoMap, type PhotoMarker } from "@/components/molecules/KakaoMap/KakaoMap";
import { getPhotos, type PhotoLocation } from "@/lib/api/photos";
import { clusterPhotos } from "@/domain/PhotoMap/photoMapUtils";

interface Props {
  invitationId?: string;
  onViewAll?: () => void;
}

export function PlaceLogPreview({ invitationId, onViewAll }: Props) {
  const mapSdkReady = useKakaoMapsSdk();

  const { data, isLoading } = useQuery({
    queryKey: ["invitations", invitationId, "photos", "locations"],
    queryFn: () => getPhotos(invitationId!, undefined, 100),
    enabled: !!invitationId,
  });

  const photoLocations: PhotoLocation[] = useMemo(() => {
    return (data?.rows ?? [])
      .filter(
        (p) => p.exifMetadata?.gps_lat != null && p.exifMetadata?.gps_lng != null,
      )
      .map((p) => ({
        ...p,
        takenAt: p.takenAt,
        gpsLat: p.exifMetadata!.gps_lat!,
        gpsLng: p.exifMetadata!.gps_lng!,
      }));
  }, [data]);

  const clusters = useMemo(() => clusterPhotos(photoLocations), [photoLocations]);

  const photoMarkers: PhotoMarker[] = clusters.map((c) => ({
    id: c.id,
    lat: c.lat,
    lng: c.lng,
    url: c.representativeUrl,
    count: c.count,
  }));

  function handleMarkerClick() {
    onViewAll?.();
  }

  const isEmpty = !isLoading && mapSdkReady && photoLocations.length === 0;

  return (
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
  );
}

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
  eventLat?: number;
  eventLng?: number;
  onViewAll?: () => void;
}

export function PlaceLogPreview({ invitationId, eventLat, eventLng, onViewAll }: Props) {
  const mapSdkReady = useKakaoMapsSdk();

  const { data, isLoading } = useQuery({
    queryKey: ["invitations", invitationId, "photos", "locations"],
    queryFn: () => getPhotos(invitationId!, undefined, 100),
    enabled: !!invitationId,
  });

  const photoLocations: PhotoLocation[] = useMemo(() => {
    return (data?.rows ?? [])
      .map((p) => {
        const lat = (p.exifMetadata?.gps_lat as number | undefined) ?? eventLat;
        const lng = (p.exifMetadata?.gps_lng as number | undefined) ?? eventLng;
        if (lat == null || lng == null) return null;
        return { ...p, takenAt: p.takenAt, gpsLat: lat, gpsLng: lng };
      })
      .filter((p): p is PhotoLocation => p !== null);
  }, [data, eventLat, eventLng]);

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

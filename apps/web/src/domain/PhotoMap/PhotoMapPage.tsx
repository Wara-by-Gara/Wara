"use client";

import { useState, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import { useKakaoMapsSdk } from "@/hooks/useKakaoMapsSdk";
import { MapLoadingSkeleton } from "@/components/organisms/Skeleton";
import { KakaoMap, type PhotoMarker, type KakaoMapHandle } from "@/components/molecules/KakaoMap/KakaoMap";
import { Icon } from "@/components/icons";
import { StickyHeader } from "@/components/layout/StickyHeader";
import { stickyMainTop } from "@/lib/mobilePageLayout";
import { getMyPhotoLocations, getPhotos, type PhotoLocation } from "@/lib/api/photos";
import { getInvitation } from "@/lib/api/invitations";
import { ROUTES } from "@/constants/routes";
import { PhotoModal } from "./PhotoModal";
import { clusterPhotos, formatTakenAt, type Cluster } from "./photoMapUtils";

// ── 컴포넌트 ──────────────────────────────────────────────────────────────────
export function PhotoMapPage({ invitationId }: { invitationId?: string }) {
  const mapSdkReady = useKakaoMapsSdk();
  const router = useRouter();
  const mapRef = useRef<KakaoMapHandle>(null);

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  function toggleGroup(id: string) {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function getClusterLabel(cluster: Cluster, index: number): string {
    const address = (cluster.photos[0]?.exifMetadata as Record<string, unknown> | null)
      ?.gps_address as string | undefined;
    if (address) return address;
    const eventAddress = invDetail?.eventLocation?.address ?? invDetail?.eventLocation?.placeName;
    return eventAddress ?? `위치 ${index + 1}`;
  }

  const { data: invPhotos, isLoading: isLoadingInv } = useQuery({
    queryKey: ["invitations", invitationId, "photos", "locations"],
    queryFn: () => getPhotos(invitationId!, undefined, 100),
    enabled: !!invitationId,
  });

  const { data: allLocations = [], isLoading: isLoadingAll } = useQuery({
    queryKey: ["photos", "locations"],
    queryFn: getMyPhotoLocations,
    enabled: !invitationId,
  });

  const { data: invDetail } = useQuery({
    queryKey: ["invitations", invitationId],
    queryFn: () => getInvitation(invitationId!),
    enabled: !!invitationId,
  });

  const isLoading = invitationId ? isLoadingInv : isLoadingAll;

  const eventLat = invDetail?.eventLocation?.lat;
  const eventLng = invDetail?.eventLocation?.lng;

  const photoLocations: PhotoLocation[] = useMemo(() => {
    if (invitationId) {
      return (invPhotos?.rows ?? [])
        .map((p) => {
          const lat = (p.exifMetadata?.gps_lat as number | undefined) ?? eventLat;
          const lng = (p.exifMetadata?.gps_lng as number | undefined) ?? eventLng;
          if (lat == null || lng == null) return null;
          return { ...p, takenAt: p.takenAt, gpsLat: lat, gpsLng: lng };
        })
        .filter((p): p is PhotoLocation => p !== null);
    }
    return allLocations;
  }, [invitationId, invPhotos, allLocations, eventLat, eventLng]);

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

  const selectedPhoto = selectedIndex != null ? (sortedPhotos[selectedIndex] ?? null) : null;

  function handleMarkerClick(markerId: string) {
    const cluster = clusters.find((c) => c.id === markerId);
    if (!cluster) return;
    const photo = cluster.photos[0];
    if (!photo) return;
    const idx = sortedPhotos.findIndex((p) => p.id === photo.id);
    setSelectedIndex(idx >= 0 ? idx : 0);
  }

  return (
    <div className="relative mx-auto flex h-full min-h-full w-full max-w-md flex-col bg-background">
      <StickyHeader
        title="Photo log"
        rightSlot={
          <button
            type="button"
            aria-label="닫기"
            onClick={() => router.push(ROUTES.PROFILE.ME)}
            className="inline-flex size-11 items-center justify-center text-text-secondary"
          >
            <Icon name="close" size="lg" color="currentColor" decorative />
          </button>
        }
      />

      <main className={`relative z-10 min-h-0 flex-1 overflow-y-auto ${stickyMainTop}`}>
        {/* 헤더 카드 — 전체 사진 개수 */}
        <div className="flex items-center justify-between border-b border-border bg-surface px-page py-3">
          <span className="text-[14px] font-medium text-text-primary">{invitationId ? "모임 사진" : "내 사진"}</span>
          <span className="text-[12px] text-text-tertiary">
            사진 {photoLocations.length}장
          </span>
        </div>

        {/* 지도 — 50vh 고정 */}
        <div className="relative h-[40vh] w-full overflow-hidden">
          <KakaoMap
            ref={mapRef}
            ready={mapSdkReady}
            photoMarkers={photoMarkers}
            onPhotoMarkerClick={handleMarkerClick}
            autoFit="first"
            className="absolute inset-0"
          />
          {(isLoading || !mapSdkReady) && <MapLoadingSkeleton />}
        </div>

        {/* 하단 — 위치별 그룹 아코디언 */}
        {!isLoading && mapSdkReady && (
          clusters.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-page py-12 text-center">
              <p className="text-[15px] font-bold text-text-primary">
                위치 정보가 있는 사진이 없어요
              </p>
              <p className="mt-1 text-[12px] text-text-secondary">
                GPS 정보가 담긴 사진을 업로드하면<br />여기서 확인할 수 있어요
              </p>
            </div>
          ) : (
            <div className="flex flex-col">
              {clusters.map((cluster, i) => {
                const isOpen = expandedGroups.has(cluster.id);
                const label = getClusterLabel(cluster, i);
                return (
                  <div key={cluster.id}>
                    <button
                      type="button"
                      onClick={() => {
                        toggleGroup(cluster.id);
                        if (!isOpen) {
                          mapRef.current?.centerOn(cluster.lat, cluster.lng);
                        }
                      }}
                      className="flex w-full items-center justify-between border-b border-border bg-surface px-page py-3 active:bg-background-soft"
                    >
                      <div className="flex items-center gap-2">
                        <Icon name="map-pin" size="sm" color="inactive" decorative />
                        <span className="text-[13px] font-semibold text-text-primary">{label}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] text-text-tertiary">{cluster.count}장</span>
                        <span className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}>
                          <Icon name="chevron-down" size="xs" color="inactive" decorative />
                        </span>
                      </div>
                    </button>
                    {isOpen && (
                      <div className="max-h-[320px] overflow-y-auto">
                      <div className="grid grid-cols-3 gap-0.5 p-0.5">
                        {cluster.photos.map((photo) => (
                          <button
                            key={photo.id}
                            type="button"
                            onClick={() => setSelectedIndex(sortedPhotos.indexOf(photo))}
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
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )
        )}
      </main>

      {selectedPhoto && (
        <PhotoModal
          photo={selectedPhoto}
          onClose={() => setSelectedIndex(null)}
          onPrev={selectedIndex != null && selectedIndex > 0
            ? () => setSelectedIndex(selectedIndex - 1)
            : undefined}
          onNext={selectedIndex != null && selectedIndex < sortedPhotos.length - 1
            ? () => setSelectedIndex(selectedIndex + 1)
            : undefined}
        />
      )}
    </div>
  );
}

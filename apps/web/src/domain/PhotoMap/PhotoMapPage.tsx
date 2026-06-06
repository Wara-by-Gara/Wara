"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useKakaoMapsSdk } from "@/hooks/useKakaoMapsSdk";
import { MapLoadingSkeleton } from "@/components/organisms/Skeleton";
import { KakaoMap, type PhotoMarker } from "@/components/molecules/KakaoMap/KakaoMap";
import { getMyPhotoLocations, type PhotoLocation } from "@/lib/api/photos";
import dynamic from "next/dynamic";

const PhotoDetailModal = dynamic(
  () =>
    import(
      "@/domain/InvitationDetail/PhotoWithFeedback/PhotoDetailModal/PhotoDetailModal"
    ),
  { ssr: false },
);

// ── 클러스터링 ────────────────────────────────────────────────────────────────
const CLUSTER_RADIUS_M = 30;

function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6_371_000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

interface Cluster {
  id: string;
  lat: number;
  lng: number;
  representativeUrl: string;
  count: number;
  photos: PhotoLocation[];
}

function clusterPhotos(photos: PhotoLocation[]): Cluster[] {
  const assigned = new Set<string>();
  const clusters: Cluster[] = [];

  for (const photo of photos) {
    if (assigned.has(photo.id)) continue;

    const group: PhotoLocation[] = [photo];
    assigned.add(photo.id);

    for (const other of photos) {
      if (assigned.has(other.id)) continue;
      if (
        haversineMeters(photo.gpsLat, photo.gpsLng, other.gpsLat, other.gpsLng) <=
        CLUSTER_RADIUS_M
      ) {
        group.push(other);
        assigned.add(other.id);
      }
    }

    // 최신순 정렬 (takenAt 우선, 없으면 createdAt)
    const sorted = [...group].sort((a, b) => {
      const ta = new Date(a.takenAt ?? a.createdAt).getTime();
      const tb = new Date(b.takenAt ?? b.createdAt).getTime();
      return tb - ta;
    });

    const rep = sorted[0]!;
    const lat = group.reduce((s, p) => s + p.gpsLat, 0) / group.length;
    const lng = group.reduce((s, p) => s + p.gpsLng, 0) / group.length;

    clusters.push({
      id: rep.id,
      lat,
      lng,
      representativeUrl: rep.url,
      count: group.length,
      photos: sorted,
    });
  }

  return clusters;
}

// ── 컴포넌트 ──────────────────────────────────────────────────────────────────
export function PhotoMapPage() {
  const mapSdkReady = useKakaoMapsSdk();

  // 선택된 클러스터 (핀 클릭 시 설정)
  const [selectedCluster, setSelectedCluster] = useState<Cluster | null>(null);
  // 클러스터 목록 시트에서 선택된 사진 인덱스 (PhotoDetailModal용)
  const [detailIndex, setDetailIndex] = useState<number | null>(null);
  // 좋아요 상태 관리
  const [likedMap, setLikedMap] = useState<Map<string, boolean>>(new Map());
  const [likeCountMap, setLikeCountMap] = useState<Map<string, number>>(new Map());

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

  function handleMarkerClick(markerId: string) {
    const cluster = clusters.find((c) => c.id === markerId);
    if (!cluster) return;

    if (cluster.count === 1) {
      // 사진 1장 → 바로 PhotoDetailModal
      setSelectedCluster(cluster);
      setDetailIndex(0);
    } else {
      // 여러 장 → 위치 목록 시트
      setSelectedCluster(cluster);
      setDetailIndex(null);
    }
  }

  function handleLikeChange(photoId: string, liked: boolean, likeCount: number) {
    setLikedMap((prev) => new Map(prev).set(photoId, liked));
    setLikeCountMap((prev) => new Map(prev).set(photoId, likeCount));
  }

  function closeAll() {
    setSelectedCluster(null);
    setDetailIndex(null);
  }

  const showLocationSheet = selectedCluster !== null && detailIndex === null;
  const showDetailModal = selectedCluster !== null && detailIndex !== null;

  return (
    <>
      <div className="relative h-full w-full">
        {/* 지도 */}
        <KakaoMap
          ready={mapSdkReady}
          photoMarkers={photoMarkers}
          onPhotoMarkerClick={handleMarkerClick}
          className="h-full w-full"
        />

        {/* 로딩 오버레이 */}
        {(isLoading || !mapSdkReady) && <MapLoadingSkeleton />}

        {/* 사진 없음 */}
        {!isLoading && mapSdkReady && photoLocations.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="rounded-xs bg-white/90 px-8 py-6 text-center shadow-md">
              <p className="text-[16px] font-bold text-text-primary">위치 정보가 있는 사진이 없어요</p>
              <p className="mt-1 text-[13px] text-text-secondary">
                GPS 정보가 담긴 사진을 업로드하면<br />여기서 확인할 수 있어요
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 위치별 사진 목록 시트 */}
      {showLocationSheet && selectedCluster && (
        <div className="fixed inset-0 z-50 flex items-end">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={closeAll}
          />
          <div className="relative w-full rounded-t-xs bg-surface pb-safe pt-4">
            <div className="flex items-center justify-between px-page pb-3">
              <span className="text-[16px] font-bold text-text-primary">
                이 장소의 사진 {selectedCluster.count}장
              </span>
              <button
                type="button"
                onClick={closeAll}
                className="text-[22px] leading-none text-text-tertiary"
                aria-label="닫기"
              >
                ×
              </button>
            </div>
            <div className="grid grid-cols-3 gap-0.5 max-h-[60vh] overflow-y-auto">
              {selectedCluster.photos.map((photo, idx) => (
                <button
                  key={photo.id}
                  type="button"
                  className="aspect-square overflow-hidden bg-gray-100"
                  onClick={() => setDetailIndex(idx)}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.url}
                    alt=""
                    className="h-full w-full object-cover transition-opacity hover:opacity-80"
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* PhotoDetailModal */}
      {showDetailModal && selectedCluster && detailIndex !== null && (
        <PhotoDetailModal
          photos={selectedCluster.photos}
          initialIndex={detailIndex}
          onClose={closeAll}
          likedMap={likedMap}
          likeCountMap={likeCountMap}
          onLikeChange={handleLikeChange}
        />
      )}
    </>
  );
}

'use client';

import { useState, useMemo } from 'react';
import { Photo, getDownloadUrls, getAllDownloadUrls, PhotoDownloadItem, togglePhotoLike } from '@/lib/api/photos';
import { PhotoListModal } from '@/components/organisms/PhotoListModal';
import PhotoDetailModal from '@/domain/InvitationDetail/PhotoWithFeedback/PhotoDetailModal/PhotoDetailModal';

interface Props {
  photos: Photo[];
  total: number;
  isLoadingMore?: boolean;
  onClose: () => void;
  initialLikedMap?: Map<string, boolean>;
  initialLikeCountMap?: Map<string, number>;
  onLikeChange?: (photoId: string, liked: boolean, likeCount: number) => void;
}

const triggerDownloads = (items: PhotoDownloadItem[]) => {
  items.forEach(({ url }, i) => {
    setTimeout(() => {
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = url;
      document.body.appendChild(iframe);
      setTimeout(() => {
        if (document.body.contains(iframe)) document.body.removeChild(iframe);
      }, 60_000);
    }, i * 300);
  });
};

export default function AlbumModal({
  photos,
  total,
  isLoadingMore = false,
  onClose,
  initialLikedMap,
  initialLikeCountMap,
  onLikeChange,
}: Props) {
  const invitationId = photos[0]?.invitationId;

  const sortedPhotos = useMemo(() => {
    return [...photos].sort((a, b) => {
      const aKey = a.takenAt ? 0 : (a.exifMetadata?.gps_address ? 1 : 2);
      const bKey = b.takenAt ? 0 : (b.exifMetadata?.gps_address ? 1 : 2);
      if (aKey !== bKey) return aKey - bKey;
      if (a.takenAt && b.takenAt) return new Date(a.takenAt).getTime() - new Date(b.takenAt).getTime();
      if (a.exifMetadata?.gps_address && b.exifMetadata?.gps_address) {
        return a.exifMetadata.gps_address.localeCompare(b.exifMetadata.gps_address);
      }
      return 0;
    });
  }, [photos]);

  const [viewingIndex, setViewingIndex] = useState<number | null>(null);
  const [likedMap, setLikedMap] = useState(() => {
    const base = new Map(photos.map((p) => [p.id, p.liked ?? false]));
    initialLikedMap?.forEach((v, k) => base.set(k, v));
    return base;
  });
  const [likeCountMap, setLikeCountMap] = useState(() => {
    const base = new Map(photos.map((p) => [p.id, p.likeCount]));
    initialLikeCountMap?.forEach((v, k) => base.set(k, v));
    return base;
  });

  const handleLikeChange = (photoId: string, liked: boolean, likeCount: number) => {
    setLikedMap((prev) => new Map(prev).set(photoId, liked));
    setLikeCountMap((prev) => new Map(prev).set(photoId, likeCount));
    onLikeChange?.(photoId, liked, likeCount);
  };

  const handlePhotoLike = async (photoId: string) => {
    if (!invitationId) return;
    const currentLiked = likedMap.get(photoId) ?? false;
    const currentCount = likeCountMap.get(photoId) ?? 0;
    const newLiked = !currentLiked;
    setLikedMap((prev) => new Map(prev).set(photoId, newLiked));
    setLikeCountMap((prev) => new Map(prev).set(photoId, newLiked ? currentCount + 1 : currentCount - 1));
    onLikeChange?.(photoId, newLiked, newLiked ? currentCount + 1 : currentCount - 1);
    try {
      const result = await togglePhotoLike(invitationId, photoId);
      setLikedMap((prev) => new Map(prev).set(photoId, result.liked));
      setLikeCountMap((prev) => new Map(prev).set(photoId, result.likeCount));
      onLikeChange?.(photoId, result.liked, result.likeCount);
    } catch {
      setLikedMap((prev) => new Map(prev).set(photoId, currentLiked));
      setLikeCountMap((prev) => new Map(prev).set(photoId, currentCount));
      onLikeChange?.(photoId, currentLiked, currentCount);
    }
  };

  const timelineGroups = useMemo(() => {
    const buckets = new Map<string, typeof sortedPhotos>();
    const addressTimeBuckets = new Map<string, Set<string>>(); // address → Set<timeBucketKey>

    // 1단계: takenAt 있는 사진으로 시간 버킷 구성
    for (const photo of sortedPhotos) {
      if (!photo.takenAt) continue;
      const d = new Date(photo.takenAt);
      d.setMinutes(0, 0, 0);
      const key = d.toISOString();
      const bucket = buckets.get(key) ?? [];
      bucket.push(photo);
      buckets.set(key, bucket);
      const addr = photo.exifMetadata?.gps_address;
      if (addr) {
        const s = addressTimeBuckets.get(addr) ?? new Set();
        s.add(key);
        addressTimeBuckets.set(addr, s);
      }
    }

    // 2단계: takenAt 없는 사진 처리
    for (const photo of sortedPhotos) {
      if (photo.takenAt) continue;
      const addr = photo.exifMetadata?.gps_address;
      const matching = addr ? addressTimeBuckets.get(addr) : undefined;
      let key: string;
      if (matching?.size === 1) {
        key = [...matching][0]!; // 유일한 시간버킷에 병합 (size === 1 보장)
      } else if (matching && matching.size >= 2) {
        key = '__no_time__';    // 여러 시간버킷에 걸쳐있어 특정 불가 → 그 외 사진
      } else if (addr) {
        key = `loc:${addr}`;    // 매칭 시간버킷 없음 → 위치 버킷
      } else {
        key = '__no_time__';
      }
      const bucket = buckets.get(key) ?? [];
      bucket.push(photo);
      buckets.set(key, bucket);
    }

    return Array.from(buckets.entries()).map(([key, groupPhotos]) => {
      let label: string;
      if (key === '__no_time__') {
        label = '그 외 사진';
      } else if (key.startsWith('loc:')) {
        label = key.slice(4);
      } else {
        const timeStr = new Date(key).toLocaleTimeString('ko-KR', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        });
        const location = groupPhotos.find((p) => p.exifMetadata?.gps_address)?.exifMetadata?.gps_address;
        label = location ? `${timeStr} · ${location}` : timeStr;
      }

      return {
        label,
        photos: groupPhotos.map((p) => ({
          id: p.id,
          src: p.url,
          alt: '',
          likeCount: likeCountMap.get(p.id) ?? p.likeCount,
          liked: likedMap.get(p.id) ?? false,
          createdAt: p.createdAt,
        })),
      };
    });
  }, [sortedPhotos, likedMap, likeCountMap]);

  const handleSelectDownload = async (photoIds: string[]) => {
    if (!invitationId || photoIds.length === 0) return;
    const items = await getDownloadUrls(invitationId, photoIds);
    triggerDownloads(items);
  };

  const handleDownloadAll = async () => {
    if (!invitationId) return;
    const items = await getAllDownloadUrls(invitationId);
    triggerDownloads(items);
  };

  return (
    <>
      <PhotoListModal
        open
        onOpenChange={(o) => { if (!o) onClose(); }}
        title={`전체 사진 ${total}장`}
        isLoadingMore={isLoadingMore}
        groups={timelineGroups}
        onPhotoClick={(idx) => setViewingIndex(idx)}
        onPhotoLike={handlePhotoLike}
        onSelectDownload={handleSelectDownload}
        onDownloadAll={handleDownloadAll}
      />
      {viewingIndex !== null && (
        <PhotoDetailModal
          photos={sortedPhotos}
          initialIndex={viewingIndex}
          onClose={() => setViewingIndex(null)}
          likedMap={likedMap}
          likeCountMap={likeCountMap}
          onLikeChange={handleLikeChange}
        />
      )}
    </>
  );
}

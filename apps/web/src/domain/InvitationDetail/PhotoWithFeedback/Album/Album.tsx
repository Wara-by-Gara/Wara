'use client';

import { useRef, useState } from 'react';
import exifr from 'exifr';
import { useQueryClient } from '@tanstack/react-query';
import { type Photo, getPresignedUrl, registerPhoto, togglePhotoLike } from '@/lib/api/photos';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { Icon } from '@/components/icons';
import { cn } from '@/lib/cn';
import AlbumModal from '../AlbumModal/AlbumModal';
import PhotoDetailModal from '../PhotoDetailModal/PhotoDetailModal';
import { PhotoGrid } from '@/components/organisms/PhotoGrid';
import { PhotoGridItem } from '@/components/organisms/PhotoGridItem';

// 서버 PHOTO_TOO_LARGE(413)와 동일한 10MB. 업로드 전 사전 차단해 모바일 데이터·시간 낭비 방지.
const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ALLOWED_CONTENT_TYPES: Record<string, string> = {
  'image/jpeg': 'image/jpeg',
  'image/png': 'image/png',
  'image/webp': 'image/webp',
  'image/heic': 'image/heic',
  'image/heif': 'image/heif',
};

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function resolveContentType(file: File): string | null {
  if (ALLOWED_CONTENT_TYPES[file.type]) return file.type;
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (ext === 'heic') return 'image/heic';
  if (ext === 'heif') return 'image/heif';
  return null;
}

type UploadState = 'idle' | 'previewing' | 'uploading' | 'complete' | 'failed' | 'partialFailed';

interface Props {
  invitationId: string;
  photos: Photo[];
  total: number;
  hasNextPage: boolean;
  fetchAllPages: () => Promise<void>;
  isFetchingNextPage: boolean;
  isDarkBg?: boolean;
}

export default function Album({
  invitationId,
  photos,
  total,
  hasNextPage,
  fetchAllPages,
  isFetchingNextPage,
  isDarkBg,
}: Props) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showModal, setShowModal] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [likedMap, setLikedMap] = useState<Map<string, boolean>>(new Map());
  const [likeCountMap, setLikeCountMap] = useState<Map<string, number>>(new Map());

  const [uploadState, setUploadState] = useState<UploadState>('idle');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState({ done: 0, total: 0 });
  const [uploadResult, setUploadResult] = useState<{ successCount: number; duplicateCount: number }>({ successCount: 0, duplicateCount: 0 });
  const [oversizedCount, setOversizedCount] = useState(0);
  const [isLoadingAllPhotos, setIsLoadingAllPhotos] = useState(false);

  const previewLimit = 5;
  const preview = photos.slice(0, previewLimit);
  // 미리보기 그리드: 첫 5장 + (총 장수 − 5). 아직 더 불러올 때는 API total, 전부 로드됐으면 실제 개수.
  const totalForOverflow = !hasNextPage
    ? photos.length
    : total > 0
      ? total
      : photos.length;
  const remaining = Math.max(totalForOverflow - preview.length, 0);
  const overflowLabel = `+${remaining}`;

  // React Query photos 캐시(무한쿼리 pages[].rows[])의 해당 사진 liked/likeCount를 패치.
  // 로컬 맵만 갱신하면 컴포넌트 리마운트 시 stale 캐시값이 보이다 새로고침 때 점프하므로
  // 캐시도 함께 갱신해 단일 출처(서버값)로 수렴시킨다.
  const patchPhotoCache = (photoId: string, liked: boolean, likeCount: number) => {
    queryClient.setQueryData(
      QUERY_KEYS.invitations.photos(invitationId),
      (old: { pages: { rows: Photo[] }[]; pageParams: unknown[] } | undefined) => {
        if (!old?.pages) return old;
        return {
          ...old,
          pages: old.pages.map((pg) => ({
            ...pg,
            rows: pg.rows.map((p) =>
              p.id === photoId ? { ...p, liked, likeCount } : p,
            ),
          })),
        };
      },
    );
  };

  const handleLikeChange = (photoId: string, liked: boolean, likeCount: number) => {
    setLikedMap((prev) => new Map(prev).set(photoId, liked));
    setLikeCountMap((prev) => new Map(prev).set(photoId, likeCount));
    patchPhotoCache(photoId, liked, likeCount);
  };

  const handlePhotoLike = async (photoId: string) => {
    const currentLiked = likedMap.has(photoId) ? likedMap.get(photoId)! : (photos.find((p) => p.id === photoId)?.liked ?? false);
    const currentCount = likeCountMap.get(photoId) ?? photos.find((p) => p.id === photoId)?.likeCount ?? 0;
    const newLiked = !currentLiked;
    handleLikeChange(photoId, newLiked, newLiked ? currentCount + 1 : currentCount - 1);
    try {
      const result = await togglePhotoLike(invitationId, photoId);
      handleLikeChange(photoId, result.liked, result.likeCount);
    } catch {
      handleLikeChange(photoId, currentLiked, currentCount);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const typeValid = Array.from(e.target.files ?? []).filter((f) => resolveContentType(f) !== null);
    e.target.value = '';
    // 10MB 초과는 업로드 전 제외 (서버가 전량 전송 후 413을 내는 낭비 방지)
    const files = typeValid.filter((f) => f.size <= MAX_FILE_SIZE);
    setOversizedCount(typeValid.length - files.length);
    if (files.length === 0) return;
    const urls = await Promise.all(files.map(readAsDataUrl));
    setSelectedFiles(files);
    setPreviewUrls(urls);
    setUploadState('previewing');
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;
    setUploadState('uploading');
    setUploadProgress({ done: 0, total: selectedFiles.length });

    let successCount = 0;
    let duplicateCount = 0;
    for (const file of selectedFiles) {
      try {
        const contentType = resolveContentType(file)!;
        const { presignedUrl, key } = await getPresignedUrl(invitationId, file.name, contentType);
        const putRes = await fetch(presignedUrl, { method: 'PUT', headers: { 'Content-Type': contentType }, body: file });
        // fetch는 4xx/5xx에 throw하지 않음 — presigned URL 만료(403)·S3 오류 시 registerPhoto로 진행되면
        // S3 객체 없는 깨진 사진이 등록됨. 명시적으로 실패 처리해 아래 catch에서 실패로 집계한다.
        if (!putRes.ok) throw new Error('PHOTO_UPLOAD_FAILED');
        const [gps, exifFull] = await Promise.all([
          exifr.gps(file).catch(() => null),
          exifr.parse(file, ['DateTimeOriginal', 'Make', 'Model']).catch(() => null),
        ]);
        const make = (exifFull?.Make as string | undefined) ?? undefined;
        const model = (exifFull?.Model as string | undefined) ?? undefined;
        await registerPhoto(invitationId, key, {
          takenAt: (exifFull?.DateTimeOriginal as Date | undefined)?.toISOString(),
          fileSize: file.size,
          exifMetadata: gps
            ? { gps_lat: gps.latitude, gps_lng: gps.longitude, make, model }
            : (make || model)
              ? { make, model }
              : undefined,
        });
        successCount++;
        setUploadProgress((prev) => ({ ...prev, done: prev.done + 1 }));
      } catch (e) {
        if (e instanceof Error && e.message === 'PHOTO_DUPLICATE') {
          duplicateCount++;
          setUploadProgress((prev) => ({ ...prev, done: prev.done + 1 }));
        }
        // 다른 개별 실패는 무시하고 다음 파일 처리
      }
    }

    setUploadResult({ successCount, duplicateCount });
    await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.invitations.photos(invitationId) });

    const failedCount = selectedFiles.length - successCount - duplicateCount;
    if (successCount === 0 && duplicateCount === 0) {
      setUploadState('failed');
    } else if (failedCount > 0) {
      setUploadState('partialFailed');
    } else {
      setUploadState('complete');
    }

    setTimeout(() => {
      setUploadState('idle');
      setSelectedFiles([]);
      setPreviewUrls([]);
    }, 2000);
  };

  const handleCancelUpload = () => {
    setUploadState('idle');
    setSelectedFiles([]);
    setPreviewUrls([]);
  };

  const handleOpenAlbumModal = async () => {
    setShowModal(true);
    if (!hasNextPage) return;
    setIsLoadingAllPhotos(true);
    try {
      await fetchAllPages();
    } finally {
      setIsLoadingAllPhotos(false);
    }
  };

  return (
    <>
      <div>
        <div className="mb-2 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <span className={cn('text-[15px] font-bold', isDarkBg ? 'text-white' : 'text-text')}>사진 앨범</span>
            <p className={cn('text-[12px]', isDarkBg ? 'text-white/70' : 'text-text-muted')}>{totalForOverflow}개의 사진</p>
          </div>
          <button
            type="button"
            aria-label="사진 올리기"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-text-inverse"
          >
            <Icon name="camera" size="sm" color="currentColor" decorative />
          </button>
        </div>

        {oversizedCount > 0 && (
          <p className="mb-2 text-[12px] text-danger">
            10MB가 넘는 사진 {oversizedCount}장은 업로드에서 제외했어요
          </p>
        )}

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
          className="hidden"
          onChange={handleFileChange}
        />

        {photos.length === 0 ? (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="mt-2 w-full py-8 text-center"
          >
            <Icon name="camera" size="md" color="currentColor" decorative className={cn('mx-auto mb-2', isDarkBg ? 'text-white/80' : 'text-text-disabled')} />
            <p className={cn('text-[14px] font-medium', isDarkBg ? 'text-white/80' : 'text-text-muted')}>우리 추억을 업로드 해보세요</p>
          </button>
        ) : (
          <PhotoGrid>
            {preview.map((photo, idx) => (
              <PhotoGridItem
                key={photo.id}
                src={photo.url}
                alt=""
                likeCount={likeCountMap.get(photo.id) ?? photo.likeCount}
                liked={likedMap.has(photo.id) ? likedMap.get(photo.id)! : (photo.liked ?? false)}
                onLike={() => handlePhotoLike(photo.id)}
                onClick={() => setSelectedIndex(idx)}
              />
            ))}
            {remaining > 0 && (
              <PhotoGridItem
                overflowLabel={overflowLabel}
                onClick={() => { void handleOpenAlbumModal(); }}
              />
            )}
          </PhotoGrid>
        )}
      </div>

      {uploadState === 'previewing' && (
        <div className="mt-2 rounded-md border border-border bg-surface p-4">
          <div className="mb-3 flex gap-1.5 overflow-x-auto">
            {selectedFiles.map((_, i) => (
              <div key={i} className="relative size-14 shrink-0 overflow-hidden rounded-sm bg-gray-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={previewUrls[i]} alt="" className="size-full object-cover" />
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={handleCancelUpload} className="flex-1 rounded-sm border border-border py-2.5 text-[14px] text-text-muted">
              취소
            </button>
            <button type="button" onClick={handleUpload} className="flex-1 rounded-sm bg-primary py-2.5 text-[14px] font-semibold text-text-inverse">
              {selectedFiles.length}장 올리기
            </button>
          </div>
        </div>
      )}

      {uploadState === 'uploading' && (
        <div className="mt-2 rounded-md border border-border bg-surface px-4 py-3 text-center text-[14px] text-text-muted">
          사진 {uploadProgress.total}장 중 {uploadProgress.done}장 업로드 중...
        </div>
      )}

      {uploadState === 'complete' && (
        <div className="mt-2 rounded-md bg-green-50 px-4 py-3 text-center text-[14px] font-bold text-green-600">
          {uploadResult.successCount > 0
            ? `${uploadResult.successCount}장 올리기 완료${uploadResult.duplicateCount > 0 ? ` (${uploadResult.duplicateCount}장은 이미 업로드된 사진이에요)` : ''}`
            : `${uploadResult.duplicateCount}장은 이미 업로드된 사진이에요`}
        </div>
      )}

      {(uploadState === 'failed' || uploadState === 'partialFailed') && (
        <div className="mt-2 rounded-md bg-red-50 px-4 py-3 text-center text-[14px] text-danger">
          {uploadState === 'failed'
            ? '업로드에 실패했어요'
            : `일부 사진 업로드에 실패했어요${uploadResult.duplicateCount > 0 ? ` (${uploadResult.duplicateCount}장은 이미 업로드된 사진)` : ''}`}
        </div>
      )}

      {showModal && (
        <AlbumModal
          photos={photos}
          total={totalForOverflow}
          isLoadingMore={isLoadingAllPhotos || isFetchingNextPage}
          onClose={() => setShowModal(false)}
          initialLikedMap={likedMap}
          initialLikeCountMap={likeCountMap}
          onLikeChange={handleLikeChange}
        />
      )}

      {selectedIndex !== null && (
        <PhotoDetailModal
          photos={photos}
          initialIndex={selectedIndex}
          onClose={() => setSelectedIndex(null)}
          likedMap={likedMap}
          likeCountMap={likeCountMap}
          onLikeChange={handleLikeChange}
        />
      )}
    </>
  );
}
'use client';

import { useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { type Photo, getPresignedUrl, registerPhoto } from '@/lib/api/photos';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { Icon } from '@/components/icons';
import AlbumModal from '../AlbumModal/AlbumModal';
import PhotoDetailModal from '../PhotoDetailModal/PhotoDetailModal';
import { PhotoGrid } from '@/components/organisms/PhotoGrid';
import { PhotoGridItem } from '@/components/organisms/PhotoGridItem';

const ALLOWED_CONTENT_TYPES: Record<string, string> = {
  'image/jpeg': 'image/jpeg',
  'image/png': 'image/png',
  'image/webp': 'image/webp',
  'image/heic': 'image/heic',
  'image/heif': 'image/heif',
};

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
  fetchNextPage: () => void;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
}

export default function Album({ invitationId, photos, total, fetchNextPage, hasNextPage, isFetchingNextPage }: Props) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showModal, setShowModal] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [likedMap, setLikedMap] = useState<Map<string, boolean>>(new Map());
  const [likeCountMap, setLikeCountMap] = useState<Map<string, number>>(new Map());

  const [uploadState, setUploadState] = useState<UploadState>('idle');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState({ done: 0, total: 0 });

  const preview = photos.slice(0, 5);
  const remaining = total - 5;

  const handleLikeChange = (photoId: string, liked: boolean, likeCount: number) => {
    setLikedMap((prev) => new Map(prev).set(photoId, liked));
    setLikeCountMap((prev) => new Map(prev).set(photoId, likeCount));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []).filter((f) => resolveContentType(f) !== null);
    e.target.value = '';
    if (files.length === 0) return;
    setSelectedFiles(files);
    setUploadState('previewing');
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;
    setUploadState('uploading');
    setUploadProgress({ done: 0, total: selectedFiles.length });

    let successCount = 0;
    for (const file of selectedFiles) {
      try {
        const contentType = resolveContentType(file)!;
        const { presignedUrl, key } = await getPresignedUrl(invitationId, file.name, contentType);
        await fetch(presignedUrl, { method: 'PUT', headers: { 'Content-Type': contentType }, body: file });
        await registerPhoto(invitationId, key);
        successCount++;
        setUploadProgress((prev) => ({ ...prev, done: prev.done + 1 }));
      } catch {
        // 개별 실패는 무시하고 다음 파일 처리
      }
    }

    await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.invitations.photos(invitationId) });

    if (successCount === 0) {
      setUploadState('failed');
    } else if (successCount < selectedFiles.length) {
      setUploadState('partialFailed');
    } else {
      setUploadState('complete');
    }

    setTimeout(() => {
      setUploadState('idle');
      setSelectedFiles([]);
    }, 2000);
  };

  const handleCancelUpload = () => {
    setUploadState('idle');
    setSelectedFiles([]);
  };

  return (
    <>
      <div className="rounded-3xl border border-border bg-surface p-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[15px] font-bold text-text-primary">앨범</span>
          <button
            type="button"
            aria-label="사진 올리기"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex size-8 items-center justify-center rounded-full bg-primary text-text-inverse"
          >
            <Icon name="camera" size="sm" color="currentColor" decorative />
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
          className="hidden"
          onChange={handleFileChange}
        />

        <PhotoGrid>
          {preview.map((photo, idx) => (
            <PhotoGridItem
              key={photo.id}
              src={photo.url}
              alt=""
              onClick={() => setSelectedIndex(idx)}
            />
          ))}
          {remaining > 0 && (
            <PhotoGridItem
              overflowLabel={`+${remaining}`}
              onClick={() => setShowModal(true)}
            />
          )}
        </PhotoGrid>
      </div>

      {uploadState === 'previewing' && (
        <div className="mt-2 rounded-2xl border border-border bg-surface p-4">
          <div className="mb-3 flex gap-1.5 overflow-x-auto">
            {selectedFiles.map((f, i) => (
              <div key={i} className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={URL.createObjectURL(f)} alt="" className="size-full object-cover" />
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={handleCancelUpload} className="flex-1 rounded-xl border border-border py-2.5 text-[14px] text-text-secondary">
              취소
            </button>
            <button type="button" onClick={handleUpload} className="flex-1 rounded-xl bg-primary py-2.5 text-[14px] font-semibold text-text-inverse">
              {selectedFiles.length}장 올리기
            </button>
          </div>
        </div>
      )}

      {uploadState === 'uploading' && (
        <div className="mt-2 rounded-2xl border border-border bg-surface px-4 py-3 text-center text-[14px] text-text-secondary">
          사진 {uploadProgress.total}장 중 {uploadProgress.done}장 업로드 중...
        </div>
      )}

      {uploadState === 'complete' && (
        <div className="mt-2 rounded-2xl bg-green-50 px-4 py-3 text-center text-[14px] font-bold text-green-600">
          업로드 완료!
        </div>
      )}

      {(uploadState === 'failed' || uploadState === 'partialFailed') && (
        <div className="mt-2 rounded-2xl bg-red-50 px-4 py-3 text-center text-[14px] text-danger">
          {uploadState === 'failed' ? '업로드에 실패했어요' : '일부 사진 업로드에 실패했어요'}
        </div>
      )}

      {showModal && (
        <AlbumModal
          photos={photos}
          onClose={() => setShowModal(false)}
          fetchNextPage={fetchNextPage}
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
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
'use client';

import { useState, useRef, useCallback } from 'react';
import imageCompression from 'browser-image-compression';
import type { Area } from 'react-easy-crop';
import type { MainImageFrame } from '@/lib/api/invitations';
import {
  getMainImagePresignedUrl,
  applyAiToMainImage,
} from '@/lib/api/invitations';
import ImageCropEditor from './ImageCropEditor';
import FrameSelector from './FrameSelector';
import { getCroppedBlob } from './cropUtils';

interface Props {
  invitationId: string;
  templatePreviewUrl: string;
  initialFrame: MainImageFrame;
  initialMainImageKey: string;
  initialUploadedImageKey: string | null;
  onSave: (data: {
    mainImageKey: string;
    mainImageFrame: MainImageFrame;
    uploadedImageKey: string | null;
  }) => void;
}

const UPLOAD_CONTENT_TYPE = 'image/webp';
const TEMP_KEY = (id: string) => `wara:inv:${id}:uploadedKey`;

export default function MainImageEditor({
  invitationId,
  templatePreviewUrl,
  initialFrame,
  initialMainImageKey,
  initialUploadedImageKey,
  onSave,
}: Props) {
  const [selectedFrame, setSelectedFrame] = useState<MainImageFrame>(initialFrame);

  // S3 keys
  const [uploadedKey, setUploadedKey] = useState<string | null>(
    initialUploadedImageKey ?? localStorage.getItem(TEMP_KEY(invitationId)),
  );
  const [aiKey, setAiKey] = useState<string | null>(
    initialFrame === 'ai' ? initialMainImageKey : null,
  );

  // 미리보기 URL (presigned)
  const [uploadedPreviewUrl, setUploadedPreviewUrl] = useState<string | null>(null);
  const [aiPreviewUrl, setAiPreviewUrl] = useState<string | null>(
    initialFrame === 'ai' ? /* 기존 mainImageUrl은 부모에서 받아올 수 있으나 일단 null */ null : null,
  );

  // 크롭 에디터 상태
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  // 로딩 / 에러
  const [isUploading, setIsUploading] = useState(false);
  const [isApplyingAi, setIsApplyingAi] = useState(false);
  const [error, setError] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // 파일 선택 → 압축 → 크롭 에디터 열기
  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');

    const compressed = await imageCompression(file, {
      maxSizeMB: 1,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
      fileType: 'image/webp',
    });

    const objectUrl = URL.createObjectURL(compressed);
    setCropSrc(objectUrl);
    // input 초기화 (같은 파일 재선택 허용)
    e.target.value = '';
  }, []);

  // 크롭 확정 → S3 업로드
  const handleCropConfirm = useCallback(async () => {
    if (!cropSrc || !croppedAreaPixels) return;
    setIsUploading(true);
    setError('');

    try {
      const blob = await getCroppedBlob(cropSrc, croppedAreaPixels);
      const fileName = `main-${Date.now()}.webp`;

      const { presignedUrl, key } = await getMainImagePresignedUrl(fileName, UPLOAD_CONTENT_TYPE);

      await fetch(presignedUrl, {
        method: 'PUT',
        body: blob,
        headers: { 'Content-Type': UPLOAD_CONTENT_TYPE },
      });

      // 기존 임시저장 교체 (localStorage 1개 유지)
      localStorage.setItem(TEMP_KEY(invitationId), key);

      const previewUrl = URL.createObjectURL(blob);
      setUploadedKey(key);
      setUploadedPreviewUrl(previewUrl);
      setCropSrc(null);

      setSelectedFrame('upload');
      onSave({ mainImageKey: key, mainImageFrame: 'upload', uploadedImageKey: key });
    } catch {
      setError('업로드에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsUploading(false);
    }
  }, [cropSrc, croppedAreaPixels, invitationId, onSave]);

  // AI 적용
  const handleApplyAi = useCallback(async () => {
    if (!uploadedKey) {
      setError('AI 적용 전에 사진을 먼저 업로드해주세요.');
      return;
    }
    setIsApplyingAi(true);
    setError('');

    try {
      const { key, url } = await applyAiToMainImage(invitationId, uploadedKey);
      setAiKey(key);
      setAiPreviewUrl(url);
      setSelectedFrame('ai');
      onSave({ mainImageKey: key, mainImageFrame: 'ai', uploadedImageKey: uploadedKey });
    } catch {
      setError('AI 적용에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsApplyingAi(false);
    }
  }, [uploadedKey, invitationId, onSave]);

  // 프레임 전환
  const handleFrameChange = useCallback((frame: MainImageFrame) => {
    setSelectedFrame(frame);
    setError('');

    if (frame === 'ai' && !aiKey && uploadedKey) {
      // AI 결과가 없으면 자동 적용 시작
      handleApplyAi();
      return;
    }

    const keyByFrame: Record<MainImageFrame, string | null> = {
      default: null, // 디폴트는 template key를 부모가 관리
      upload: uploadedKey,
      ai: aiKey,
    };

    const targetKey = keyByFrame[frame];
    if (frame === 'default' || targetKey) {
      onSave({ mainImageKey: targetKey ?? '', mainImageFrame: frame, uploadedImageKey: uploadedKey });
    }
  }, [uploadedKey, aiKey, handleApplyAi, onSave]);

  return (
    <div className="flex flex-col gap-4">
      {/* 프레임 선택 */}
      <FrameSelector
        selected={selectedFrame}
        templatePreviewUrl={templatePreviewUrl}
        uploadedImageUrl={uploadedPreviewUrl}
        aiImageUrl={aiPreviewUrl}
        isAiApplying={isApplyingAi}
        onChange={handleFrameChange}
      />

      {/* 크롭 에디터 */}
      {cropSrc ? (
        <div className="flex flex-col gap-3">
          <ImageCropEditor
            imageSrc={cropSrc}
            onCropComplete={setCroppedAreaPixels}
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setCropSrc(null)}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              취소
            </button>
            <button
              type="button"
              onClick={handleCropConfirm}
              disabled={isUploading || !croppedAreaPixels}
              className="flex-1 px-4 py-2 bg-black text-white text-sm rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors"
            >
              {isUploading ? '업로드 중...' : '적용'}
            </button>
          </div>
        </div>
      ) : (
        /* 업로드 버튼 */
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading || isApplyingAi}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors text-sm"
          >
            사진 선택
          </button>
          {uploadedKey && (
            <button
              type="button"
              onClick={handleApplyAi}
              disabled={isApplyingAi || isUploading}
              className="flex-1 px-4 py-2 bg-black text-white text-sm rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors"
            >
              {isApplyingAi ? 'AI 적용 중...' : 'AI 재적용'}
            </button>
          )}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
        className="hidden"
        onChange={handleFileChange}
      />

      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}

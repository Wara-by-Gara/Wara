'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import imageCompression from 'browser-image-compression';
import type { Area } from 'react-easy-crop';
import type { MainImageFrame } from '@/lib/api/invitations';
import {
  getInvitationImagePresignedUrl,
  applyAiToMainImage,
} from '@/lib/api/invitations';
import type { AiCompleteEventDetail } from '@/hooks/useNotifications';
import ImageCropEditor from './ImageCropEditor';
import FrameSelector from './FrameSelector';
import { getCroppedBlob } from './cropUtils';

interface Props {
  invitationId: string;
  templatePreviewUrl: string;
  initialFrame: MainImageFrame;
  initialMainImageKey: string;
  initialUploadedImageKey: string | null;
  initialUploadedImageUrl: string | null;
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
  initialUploadedImageUrl,
  onSave,
}: Props) {
  const [selectedFrame, setSelectedFrame] = useState<MainImageFrame>(initialFrame);

  // S3 keys
  const [uploadedKey, setUploadedKey] = useState<string | null>(initialUploadedImageKey ?? null);
  const [aiKey, setAiKey] = useState<string | null>(
    initialFrame === 'ai' ? initialMainImageKey : null,
  );

  // 미리보기 URL
  const [uploadedPreviewUrl, setUploadedPreviewUrl] = useState<string | null>(
    initialUploadedImageUrl,
  );
  const [aiPreviewUrl, setAiPreviewUrl] = useState<string | null>(null);

  // 크롭 에디터 상태
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  // 로딩 / 에러 / AI 비동기 상태
  const [isUploading, setIsUploading] = useState(false);
  const [isApplyingAi, setIsApplyingAi] = useState(false);
  const [pendingJobId, setPendingJobId] = useState<string | null>(null);
  const [error, setError] = useState('');

  // AI 완료 팝업
  const [showAiCompletePopup, setShowAiCompletePopup] = useState(false);
  // AI 일일 한도 초과 팝업
  const [showLimitPopup, setShowLimitPopup] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // SSR-safe localStorage 읽기 (마운트 후에만 접근)
  useEffect(() => {
    if (!initialUploadedImageKey) {
      const saved = localStorage.getItem(TEMP_KEY(invitationId));
      if (saved) setUploadedKey(saved);
    }
  }, [invitationId, initialUploadedImageKey]);

  // cropSrc Object URL 메모리 해제
  useEffect(() => {
    return () => {
      if (cropSrc) URL.revokeObjectURL(cropSrc);
    };
  }, [cropSrc]);

  // uploadedPreviewUrl Object URL 메모리 해제 (blob: URL만)
  useEffect(() => {
    return () => {
      if (uploadedPreviewUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(uploadedPreviewUrl);
      }
    };
  }, [uploadedPreviewUrl]);

  // AI 완료 WebSocket 이벤트 수신 (window 커스텀 이벤트)
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<AiCompleteEventDetail>).detail;
      if (detail.invitationId !== invitationId) return;

      setPendingJobId(null);
      setIsApplyingAi(false);

      if (detail.success && detail.key && detail.url) {
        setAiKey(detail.key);
        setAiPreviewUrl(detail.url);
        setShowAiCompletePopup(true);
      } else {
        setError('AI 처리에 실패했습니다. 다시 시도해주세요.');
      }
    };

    window.addEventListener('ai:complete', handler);
    return () => window.removeEventListener('ai:complete', handler);
  }, [invitationId]);

  // 파일 선택 → 압축 → 크롭 에디터 열기
  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');

    try {
      const compressed = await imageCompression(file, {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        fileType: 'image/webp',
      });
      const objectUrl = URL.createObjectURL(compressed);
      setCropSrc(objectUrl);
    } catch {
      setError('이미지 처리에 실패했습니다. 다시 시도해주세요.');
    } finally {
      e.target.value = '';
    }
  }, []);

  // 크롭 확정 → S3 업로드
  const handleCropConfirm = useCallback(async () => {
    if (!cropSrc || !croppedAreaPixels) return;
    setIsUploading(true);
    setError('');

    try {
      const blob = await getCroppedBlob(cropSrc, croppedAreaPixels);
      const fileName = `main-${Date.now()}.webp`;

      const { presignedUrl, key } = await getInvitationImagePresignedUrl(fileName, UPLOAD_CONTENT_TYPE);

      await fetch(presignedUrl, {
        method: 'PUT',
        body: blob,
        headers: { 'Content-Type': UPLOAD_CONTENT_TYPE },
      });

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

  // AI 적용 요청 (비동기 — jobId 반환 후 WebSocket 완료 대기)
  const handleApplyAi = useCallback(async () => {
    if (!uploadedKey) {
      setError('AI 적용 전에 사진을 먼저 업로드해주세요.');
      return;
    }
    setIsApplyingAi(true);
    setError('');

    try {
      const { jobId } = await applyAiToMainImage(invitationId, uploadedKey);
      setPendingJobId(jobId);
      // isApplyingAi는 WebSocket ai:complete 이벤트 수신 시 해제됨
    } catch (err) {
      const code = (err as { error?: { code?: string } })?.error?.code ?? '';
      if (code === 'AI_DAILY_LIMIT_EXCEEDED') {
        setShowLimitPopup(true);
      } else if (code === 'AI_SERVICE_UNAVAILABLE') {
        setError('AI 서비스가 일시적으로 이용 불가합니다. 잠시 후 다시 시도해주세요.');
      } else {
        setError('AI 적용 요청에 실패했습니다. 다시 시도해주세요.');
      }
      setIsApplyingAi(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uploadedKey, invitationId]);

  // 프레임 전환
  const handleFrameChange = useCallback((frame: MainImageFrame) => {
    setSelectedFrame(frame);
    setError('');

    if (frame === 'ai' && !aiKey && uploadedKey && !isApplyingAi) {
      handleApplyAi();
      return;
    }

    const keyByFrame: Record<MainImageFrame, string | null> = {
      default: initialMainImageKey, // 초기 키(= 템플릿 키)로 복원
      upload: uploadedKey,
      ai: aiKey,
    };

    const targetKey = keyByFrame[frame];
    if (targetKey) {
      onSave({ mainImageKey: targetKey, mainImageFrame: frame, uploadedImageKey: uploadedKey });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uploadedKey, aiKey, handleApplyAi, isApplyingAi, onSave]);

  return (
    <div className="flex flex-col gap-4">
      {/* 프레임 선택 */}
      <FrameSelector
        selected={selectedFrame}
        templatePreviewUrl={templatePreviewUrl}
        uploadedImageUrl={uploadedPreviewUrl}
        aiImageUrl={aiPreviewUrl}
        hasUploadedImage={!!uploadedKey}
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
              className="flex-1 px-4 py-2 border border-border-strong text-text-primary rounded-lg hover-emphasis-sm disabled:opacity-50 transition-[color,transform,box-shadow]"
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
      ) : isApplyingAi && pendingJobId ? (
        /* AI 백그라운드 처리 중 */
        <div className="flex items-center gap-3 px-4 py-3 bg-background-soft rounded-xl">
          <div className="w-4 h-4 border-2 border-border-strong border-t-transparent rounded-full animate-spin flex-shrink-0" />
          <p className="text-sm text-text-secondary">
            AI가 사진을 만들고 있어요. 다른 작업을 계속하셔도 됩니다.
          </p>
        </div>
      ) : (
        /* 업로드 / AI 버튼 */
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading || isApplyingAi}
            className="flex-1 px-4 py-2 border border-border-strong text-text-primary rounded-lg hover-emphasis-sm disabled:opacity-50 transition-[color,transform,box-shadow] text-sm"
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
              AI 재적용
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

      {/* AI 일일 한도 초과 팝업 */}
      {showLimitPopup && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="ai-limit-title"
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
        >
          <div className="bg-surface rounded-2xl shadow-lg max-w-sm w-full p-6">
            <p id="ai-limit-title" className="text-lg font-semibold mb-1">
              오늘의 AI 사용 횟수를 모두 썼어요
            </p>
            <p className="text-sm text-text-secondary mb-6">
              하루 3회까지 사용할 수 있어요. 내일 다시 시도해주세요.
            </p>
            <button
              type="button"
              onClick={() => setShowLimitPopup(false)}
              className="w-full px-4 py-2 bg-black text-white text-sm rounded-lg hover:bg-gray-800 transition-colors"
            >
              확인
            </button>
          </div>
        </div>
      )}

      {/* AI 완료 팝업 */}
      {showAiCompletePopup && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="ai-complete-title"
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
        >
          <div className="bg-surface rounded-2xl shadow-lg max-w-sm w-full p-6">
            <p id="ai-complete-title" className="text-lg font-semibold mb-1">
              AI 사진이 완성됐어요! 🎉
            </p>
            <p className="text-sm text-text-secondary mb-6">
              AI 탭을 확인하고 마음에 들면 적용해보세요.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowAiCompletePopup(false)}
                className="flex-1 px-4 py-2 border border-border-strong text-text-primary rounded-lg hover-emphasis-sm transition-[color,transform,box-shadow] text-sm"
              >
                나중에
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAiCompletePopup(false);
                  setSelectedFrame('ai');
                  if (aiKey) {
                    onSave({
                      mainImageKey: aiKey,
                      mainImageFrame: 'ai',
                      uploadedImageKey: uploadedKey,
                    });
                  }
                }}
                className="flex-1 px-4 py-2 bg-black text-white text-sm rounded-lg hover:bg-gray-800 transition-colors"
              >
                AI 사진 적용하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

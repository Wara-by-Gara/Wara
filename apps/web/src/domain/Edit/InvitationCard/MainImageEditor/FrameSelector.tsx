'use client';

import Image from 'next/image';
import type { MainImageFrame } from '@/lib/api/invitations';

interface Props {
  selected: MainImageFrame;
  templatePreviewUrl: string;
  uploadedImageUrl: string | null;
  aiImageUrl: string | null;
  hasUploadedImage: boolean; // 업로드 이미지 존재 여부 (AI 탭 활성화 조건)
  isAiApplying: boolean;
  onChange: (frame: MainImageFrame) => void;
}

const FRAMES: { id: MainImageFrame; label: string }[] = [
  { id: 'default', label: '디폴트' },
  { id: 'upload', label: '업로드' },
  { id: 'ai', label: 'AI 적용' },
];

export default function FrameSelector({
  selected,
  templatePreviewUrl,
  uploadedImageUrl,
  aiImageUrl,
  hasUploadedImage,
  isAiApplying,
  onChange,
}: Props) {
  const previewByFrame: Record<MainImageFrame, string | null> = {
    default: templatePreviewUrl,
    upload: uploadedImageUrl,
    ai: aiImageUrl,
  };

  return (
    <div className="flex gap-3">
      {FRAMES.map(({ id, label }) => {
        const previewUrl = previewByFrame[id];
        const isSelected = selected === id;
        const isDisabled =
          (id === 'upload' && !uploadedImageUrl) ||
          (id === 'ai' && !hasUploadedImage);

        return (
          <button
            key={id}
            type="button"
            disabled={isDisabled}
            onClick={() => onChange(id)}
            className={[
              'flex flex-col items-center gap-1.5 flex-1 rounded-sm border-2 p-2 transition-colors',
              isSelected ? 'border-black' : 'border-gray-200',
              isDisabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:border-gray-400',
            ].join(' ')}
          >
            <div className="relative w-full aspect-square rounded-sm overflow-hidden bg-gray-100">
              {id === 'ai' && isAiApplying ? (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              ) : previewUrl ? (
                <Image src={previewUrl} alt={label} fill className="object-cover" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-gray-300 text-xs">
                  없음
                </div>
              )}
            </div>
            <span className="text-xs font-medium text-gray-700">{label}</span>
          </button>
        );
      })}
    </div>
  );
}

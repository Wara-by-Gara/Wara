'use client';

import { useState } from 'react';
import Image from 'next/image';
import type { Invitation, MainImageFrame } from '@/lib/api/invitations';
import { updateInvitation } from '@/lib/api/invitations';
import MainImageEditor from '../MainImageEditor';

interface Props {
  invitation?: Invitation;
}

export default function InvitationCardContainer({ invitation }: Props) {
  const [currentMainImageUrl, setCurrentMainImageUrl] = useState(
    invitation?.mainImageUrl ?? '',
  );
  const [saveError, setSaveError] = useState('');

  if (!invitation) {
    return <div className="w-full aspect-square bg-gray-100 rounded-2xl animate-pulse" />;
  }

  const handleSave = async (data: {
    mainImageKey: string;
    mainImageFrame: MainImageFrame;
    uploadedImageKey: string | null;
  }) => {
    setSaveError('');
    try {
      const updated = await updateInvitation(invitation.id, {
        mainImageKey: data.mainImageKey,
        mainImageFrame: data.mainImageFrame,
        uploadedImageKey: data.uploadedImageKey,
      });
      setCurrentMainImageUrl(updated.mainImageUrl ?? '');
    } catch {
      setSaveError('저장에 실패했습니다. 다시 시도해주세요.');
    }
  };

  return (
    <div className="flex flex-col gap-6 p-4">
      {/* 현재 메인 이미지 미리보기 */}
      <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-gray-100">
        {currentMainImageUrl && (
          <Image
            src={currentMainImageUrl}
            alt="메인 이미지"
            fill
            className="object-cover"
          />
        )}
      </div>

      {/* 메인 이미지 편집 */}
      <MainImageEditor
        invitationId={invitation.id}
        templatePreviewUrl={invitation.mainImageUrl ?? ''}
        initialFrame="default"
        initialMainImageKey={invitation.mainImageKey ?? ''}
        initialUploadedImageKey={null}
        initialUploadedImageUrl={null}
        onSave={handleSave}
      />

      {saveError && <p className="text-sm text-red-500">{saveError}</p>}
    </div>
  );
}

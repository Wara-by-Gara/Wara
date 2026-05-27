'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useMe, useUpdateMe } from '@/hooks/useUsers';
import { getProfileImagePresignedUrl } from '@/lib/api/users';
import { getCroppedImageBlob } from '@/utils/cropImage';
import { ProfileEdit } from '@/screens/ProfileEdit';
import { ROUTES } from '@/constants/routes';
import type { Area } from 'react-easy-crop';

export default function ProfileEditContainer() {
  const router = useRouter();
  const { data: me, isLoading } = useMe();
  const { mutate: updateMe, isPending, isError, reset } = useUpdateMe();

  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);

  const handleCropComplete = useCallback(async (croppedAreaPixels: Area) => {
    if (!cropImageSrc) return;
    const blob = await getCroppedImageBlob(cropImageSrc, croppedAreaPixels);
    const file = new File([blob], 'profile.jpg', { type: 'image/jpeg' });
    const { presignedUrl, key } = await getProfileImagePresignedUrl(file.name, 'image/jpeg');
    await fetch(presignedUrl, { method: 'PUT', headers: { 'Content-Type': 'image/jpeg' }, body: file });
    updateMe({ profileImageUrl: key }, {
      onSuccess: () => setCropImageSrc(null),
    });
  }, [cropImageSrc, updateMe]);

  if (isLoading || !me) return null;

  const handleSave = (nickname: string) => {
    updateMe({ nickname }, {
      onSuccess: () => router.push(ROUTES.PROFILE.ME),
    });
  };

  const handleImageSelect = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => setCropImageSrc(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleImageDelete = () => {
    updateMe({ profileImageUrl: null });
  };

  return (
    <ProfileEdit
      state={cropImageSrc ? 'imageCrop' : isError ? 'saveFailed' : 'default'}
      isUploading={isPending}
      defaultNickname={me.nickname ?? ''}
      avatarUrl={me.profileImageUrl ?? undefined}
      cropImageSrc={cropImageSrc ?? undefined}
      onBack={() => {
        if (cropImageSrc) { setCropImageSrc(null); return; }
        router.back();
      }}
      onSave={handleSave}
      onImageSelect={handleImageSelect}
      onCropComplete={handleCropComplete}
      onImageDelete={handleImageDelete}
      onRetry={reset}
    />
  );
}

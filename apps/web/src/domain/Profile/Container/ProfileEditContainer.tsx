'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMe, useUpdateMe } from '@/hooks/useUsers';
import { getProfileImagePresignedUrl } from '@/lib/api/users';
import { getCroppedImageBlob } from '@/utils/cropImage';
import { ProfileEdit } from '@/screens/ProfileEdit';
import { ProfileImageCropScreen } from '@/components/organisms/ProfileImageCropScreen';
import { ROUTES } from '@/constants/routes';
import type { Area } from 'react-easy-crop';

type ImageChange =
  | { key: string; preview: string }  // 새 이미지
  | { key: null; preview: null };     // 삭제

export default function ProfileEditContainer() {
  const router = useRouter();
  const { data: me, isLoading } = useMe();
  const { mutate: updateMe, isPending, isError, reset } = useUpdateMe();

  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [imageChange, setImageChange] = useState<ImageChange | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  if (isLoading || !me) return null;

  const handleImageSelect = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => setCropImageSrc(reader.result as string);
    reader.readAsDataURL(file);
  };

  async function handleCropConfirm(croppedAreaPixels: Area) {
    if (!cropImageSrc) return;
    setIsUploadingImage(true);
    try {
      const blob = await getCroppedImageBlob(cropImageSrc, croppedAreaPixels);
      const file = new File([blob], 'profile.jpg', { type: 'image/jpeg' });
      const { presignedUrl, key } = await getProfileImagePresignedUrl(file.name, 'image/jpeg');
      await fetch(presignedUrl, { method: 'PUT', headers: { 'Content-Type': 'image/jpeg' }, body: file });
      setImageChange({ key, preview: URL.createObjectURL(blob) });
      setCropImageSrc(null);
    } finally {
      setIsUploadingImage(false);
    }
  }

  const handleSave = (nickname: string) => {
    updateMe(
      {
        nickname,
        ...(imageChange !== null ? { profileImageUrl: imageChange.key } : {}),
      },
      { onSuccess: () => router.push(ROUTES.PROFILE.ME) },
    );
  };

  const handleImageDelete = () => {
    setImageChange({ key: null, preview: null });
  };

  const avatarUrl =
    imageChange === null
      ? me.profileImageUrl ?? undefined
      : imageChange.key === null
      ? undefined
      : imageChange.preview;

  if (cropImageSrc) {
    return (
      <ProfileImageCropScreen
        imageSrc={cropImageSrc}
        isConfirming={isUploadingImage}
        onBack={() => setCropImageSrc(null)}
        onConfirm={handleCropConfirm}
      />
    );
  }

  return (
    <ProfileEdit
      state={isPending || isUploadingImage ? 'saveLoading' : isError ? 'saveFailed' : 'default'}
      defaultName={me.name ?? undefined}
      defaultNickname={me.nickname ?? me.name ?? ''}
      avatarUrl={avatarUrl}
      onBack={() => {
        if (cropImageSrc) { setCropImageSrc(null); return; }
        router.back();
      }}
      onSave={handleSave}
      onImageSelect={handleImageSelect}
      onImageDelete={handleImageDelete}
      onRetry={reset}
    />
  );
}

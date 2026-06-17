'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMe, useUpdateMe } from '@/hooks/useUsers';
import { getProfileImagePresignedUrl } from '@/lib/api/users';
import { getCroppedImageBlob } from '@/utils/cropImage';
import { ProfileEdit } from '@/screens/ProfileEdit';
import { ProfileImageCropScreen } from '@/components/domain/ProfileImageCropScreen';
import { ROUTES } from '@/constants/routes';
import { useAuthStore } from '@/stores/authStore';
import type { Area } from 'react-easy-crop';

type ImageChange =
  | { key: string; preview: string }  // 새 이미지
  | { key: null; preview: null };     // 삭제

export default function ProfileEditContainer() {
  const router = useRouter();
  const { hydrated, isLoggedIn } = useAuthStore();
  const { data: me, isLoading } = useMe();
  const { mutate: updateMe, isPending, isError, reset } = useUpdateMe();

  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [imageChange, setImageChange] = useState<ImageChange | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // 비로그인 사용자 직접 URL 진입 차단 — 로그인 페이지로 보냄.
  useEffect(() => {
    if (hydrated && !isLoggedIn) router.replace(ROUTES.LOGIN);
  }, [hydrated, isLoggedIn, router]);

  if (!hydrated || isLoading || !me) return null;

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
      const putRes = await fetch(presignedUrl, { method: 'PUT', headers: { 'Content-Type': 'image/jpeg' }, body: file });
      // fetch는 4xx/5xx에 throw하지 않음 — 실패해도 진행하면 S3 객체 없는 key가 프로필에 저장됨
      if (!putRes.ok) throw new Error('IMAGE_UPLOAD_FAILED');
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

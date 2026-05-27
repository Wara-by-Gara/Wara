'use client';

import { useRouter } from 'next/navigation';
import { useMe, useUpdateMe } from '@/hooks/useUsers';
import { ProfileEdit } from '@/screens/ProfileEdit';
import { ROUTES } from '@/constants/routes';

export default function ProfileEditContainer() {
  const router = useRouter();
  const { data: me, isLoading } = useMe();
  const { mutate: updateMe, isPending, isError, reset } = useUpdateMe();

  if (isLoading || !me) return null;

  const handleSave = (nickname: string) => {
    updateMe({ nickname }, {
      onSuccess: () => router.push(ROUTES.PROFILE.ME),
    });
  };

  return (
    <ProfileEdit
      state={isPending ? 'saveLoading' : isError ? 'saveFailed' : 'default'}
      defaultNickname={me.nickname ?? ''}
      onBack={() => router.back()}
      onSave={handleSave}
      onRetry={reset}
    />
  );
}

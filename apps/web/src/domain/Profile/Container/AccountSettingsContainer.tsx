'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLogout } from '@/hooks/useAuth';
import { AccountSettings, type AccountScreen } from '@/screens/AccountSettings';
import { ROUTES } from '@/constants/routes';

export default function AccountSettingsContainer() {
  const router = useRouter();
  const [screen, setScreen] = useState<AccountScreen>('connectedSocial');
  const { mutate: logout } = useLogout();

  const handleLogout = () => {
    logout(undefined, {
      onSettled: () => setScreen('logoutComplete'),
    });
  };

  return (
    <AccountSettings
      screen={screen}
      onBack={() => router.back()}
      onLogout={handleLogout}
      onLoginAgain={() => router.push(ROUTES.LOGIN)}
    />
  );
}

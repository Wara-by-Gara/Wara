'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLogout } from '@/hooks/useAuth';
import { useDeleteMe } from '@/hooks/useUsers';
import { AccountSettings, type AccountScreen } from '@/screens/AccountSettings';
import { ROUTES } from '@/constants/routes';

export default function AccountSettingsContainer() {
  const router = useRouter();
  const [screen, setScreen] = useState<AccountScreen>('connectedSocial');
  const { mutate: logout } = useLogout();
  const { mutate: deleteMe, isPending: isWithdrawing } = useDeleteMe();

  const handleLogout = () => {
    logout(undefined, {
      onSettled: () => setScreen('logoutComplete'),
    });
  };

  const handleWithdrawContinue = () => {
    if (screen === 'withdrawGuide') setScreen('withdrawReason');
    else if (screen === 'withdrawReason') setScreen('withdrawFinalConfirm');
  };

  const handleWithdrawConfirm = () => {
    deleteMe(undefined, {
      onSuccess: () => setScreen('withdrawComplete'),
    });
  };

  return (
    <AccountSettings
      screen={screen}
      onBack={() => router.back()}
      onLogout={handleLogout}
      onLoginAgain={() => router.push(ROUTES.LOGIN)}
      onWithdrawStart={() => setScreen('withdrawGuide')}
      onWithdrawContinue={handleWithdrawContinue}
      onWithdrawCancel={() => setScreen('connectedSocial')}
      onWithdrawConfirm={handleWithdrawConfirm}
      onWithdrawComplete={() => router.push(ROUTES.HOME)}
      isWithdrawing={isWithdrawing}
    />
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { useDeleteMe, useDeleteMySocial, useGetMySocials } from '@/hooks/useUsers';
import { AccountSettings, type AccountScreen } from '@/screens/AccountSettings';
import { ROUTES } from '@/constants/routes';

export default function AccountSettingsContainer() {
  const router = useRouter();
  const [screen, setScreen] = useState<AccountScreen>('connectedSocial');
  const [pendingProvider, setPendingProvider] = useState<string | null>(null);

  const { logout } = useAuthStore();
  const queryClient = useQueryClient();
  const { mutate: deleteMe, isPending: isWithdrawing } = useDeleteMe();
  const { data: socials } = useGetMySocials();
  const { mutate: deleteSocial, isPending: isDisconnecting } = useDeleteMySocial();

  const connectedProviders = socials?.map((s) => s.provider) ?? [];

  const handleLogout = async () => {
    await logout();
    queryClient.clear();
    setScreen('logoutComplete');
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

  const handleDisconnectRequest = (provider: string) => {
    setPendingProvider(provider);
    setScreen('disconnectModal');
  };

  const handleDisconnectConfirm = () => {
    if (!pendingProvider) return;
    deleteSocial(pendingProvider, {
      onSuccess: () => {
        setPendingProvider(null);
        setScreen('connectedSocial');
      },
    });
  };

  return (
    <AccountSettings
      screen={screen}
      onBack={() => {
        if (screen === 'disconnectModal') {
          setPendingProvider(null);
          setScreen('connectedSocial');
        } else {
          router.back();
        }
      }}
      onLogout={handleLogout}
      onLoginAgain={() => router.push(ROUTES.LOGIN)}
      onWithdrawStart={() => setScreen('withdrawGuide')}
      onWithdrawContinue={handleWithdrawContinue}
      onWithdrawCancel={() => setScreen('connectedSocial')}
      onWithdrawConfirm={handleWithdrawConfirm}
      onWithdrawComplete={() => router.push(ROUTES.HOME)}
      isWithdrawing={isWithdrawing}
      connectedProviders={connectedProviders}
      onDisconnectRequest={handleDisconnectRequest}
      onDisconnectConfirm={handleDisconnectConfirm}
      isDisconnecting={isDisconnecting}
    />
  );
}

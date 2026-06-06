'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { useDeleteMe, useDeleteMySocial, useGetMySocials, useLinkSocialUrl, useMergeAccounts } from '@/hooks/useUsers';
import { AccountSettings, type AccountScreen, type WithdrawalReasonKey } from '@/screens/AccountSettings';
import { toast } from '@/components/molecules/Toast';
import { ConfirmModal } from '@/components/molecules/Modal';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { ROUTES } from '@/constants/routes';

const PROVIDER_LABEL: Record<string, string> = {
  kakao: '카카오',
  naver: '네이버',
  google: 'Google',
  apple: 'Apple',
};

const LINK_ERROR_MESSAGES: Record<string, string> = {
  SOCIAL_ALREADY_LINKED: '이 소셜 계정은 다른 wara 계정에 연결되어 있어요.',
  AUTH_INVALID_STATE: '연결 요청이 만료됐어요. 다시 시도해주세요.',
  cancelled: '연결이 취소됐어요.',
};

export default function AccountSettingsContainer() {
  const router = useRouter();
  const [screen, setScreen] = useState<AccountScreen>('connectedSocial');
  const [pendingProvider, setPendingProvider] = useState<string | null>(null);
  const [linkingProvider, setLinkingProvider] = useState<string | null>(null);
  const [mergeModal, setMergeModal] = useState<{ provider: string; mergeToken: string } | null>(null);
  // 탈퇴 사유 — withdrawReason 화면의 라디오/textarea 값.
  // 이슈 #150에 따라 deleteMe payload로 전달해 BE 분석에 활용.
  const [withdrawReason, setWithdrawReason] = useState<WithdrawalReasonKey>('rarely');
  const [withdrawDetail, setWithdrawDetail] = useState<string>('');

  const { logout } = useAuthStore();
  const queryClient = useQueryClient();
  const { mutate: deleteMe, isPending: isWithdrawing } = useDeleteMe();
  const { data: socials } = useGetMySocials();
  const { mutate: deleteSocial, isPending: isDisconnecting } = useDeleteMySocial();
  const { mutate: requestLinkUrl, isPending: isLinking } = useLinkSocialUrl();
  const { mutate: doMergeAccounts, isPending: isMerging } = useMergeAccounts();

  // OAuth link callback 후 돌아왔을 때 query 파라미터 처리
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const success = params.get('link_success');
    const error = params.get('link_error');
    if (!success && !error) return;

    if (success) {
      const label = PROVIDER_LABEL[success] ?? success;
      toast.success(`${label} 계정이 연결됐어요`);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.users.socials() });
    } else if (error === 'SOCIAL_ALREADY_LINKED') {
      const mergeToken = params.get('mergeToken');
      const provider = params.get('provider');
      if (mergeToken && provider) {
        setMergeModal({ provider, mergeToken });
      } else {
        toast.error(LINK_ERROR_MESSAGES.SOCIAL_ALREADY_LINKED);
      }
    } else if (error) {
      toast.error(LINK_ERROR_MESSAGES[error] ?? '연결에 실패했어요. 다시 시도해주세요.');
    }
    window.history.replaceState({}, '', window.location.pathname);
  }, [queryClient]);

  const handleLastConnectedClick = () => {
    toast.info('다른 소셜을 먼저 연결한 뒤 해제할 수 있어요');
  };

  const handleMergeConfirm = () => {
    if (!mergeModal) return;
    doMergeAccounts(mergeModal.mergeToken, {
      onSuccess: () => {
        const label = PROVIDER_LABEL[mergeModal.provider] ?? mergeModal.provider;
        toast.success(`${label} 계정이 합쳐졌어요`);
        setMergeModal(null);
      },
      onError: () => {
        toast.error('계정 합치기에 실패했어요. 다시 시도해주세요.');
        setMergeModal(null);
      },
    });
  };

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
    deleteMe(
      { reason: withdrawReason, detail: withdrawDetail.trim() || undefined },
      {
        onSuccess: async () => {
          localStorage.removeItem('wara_onboarding_done');
          await logout();
          queryClient.clear();
          setScreen('withdrawComplete');
        },
        onError: (err) => {
          const code = err instanceof Error ? err.message : '';
          if (code === 'USER_HAS_HOSTED_INVITATIONS') {
            toast.error('호스트로 진행 중인 초대장이 있어요. 다른 멤버에게 호스트 권한을 넘긴 뒤 탈퇴해주세요.');
            setScreen('connectedSocial');
          } else {
            toast.error('탈퇴에 실패했어요. 잠시 후 다시 시도해주세요.');
          }
        },
      },
    );
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

  const handleLinkRequest = (provider: string) => {
    setLinkingProvider(provider);
    requestLinkUrl(provider, {
      onSuccess: ({ url }) => {
        window.location.href = url;
      },
      onError: () => {
        setLinkingProvider(null);
        toast.error('연결을 시작하지 못했어요. 다시 시도해주세요.');
      },
    });
  };

  return (
    <>
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
      onLinkRequest={handleLinkRequest}
      isLinking={isLinking}
      linkingProvider={linkingProvider}
      onLastConnectedClick={handleLastConnectedClick}
      withdrawReason={withdrawReason}
      withdrawDetail={withdrawDetail}
      onWithdrawReasonChange={setWithdrawReason}
      onWithdrawDetailChange={setWithdrawDetail}
    />
    {mergeModal && (
      <ConfirmModal
        open
        onOpenChange={(open) => { if (!open && !isMerging) setMergeModal(null); }}
        title={`${PROVIDER_LABEL[mergeModal.provider] ?? mergeModal.provider} 계정과 합칠까요?`}
        description="이 소셜로 가입한 다른 wara 계정의 모든 데이터(초대장, 사진 등)가 현재 계정으로 이전돼요. 되돌릴 수 없어요."
        confirmLabel={isMerging ? '합치는 중...' : '합치기'}
        confirmVariant="danger"
        onConfirm={handleMergeConfirm}
        loading={isMerging}
      />
    )}
    </>
  );
}

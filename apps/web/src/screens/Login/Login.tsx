'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/primitives/Button';
import { ROUTES } from '@/constants/routes';
import { SocialLoginButton } from '@/components/primitives/SocialLoginButton';
import type { SocialProvider } from '@/components/primitives/SocialLoginButton/providers';
import { ConfirmModal } from '@/components/molecules/Modal';
import {
  BottomSheet,
  BottomSheetContent,
} from '@/components/molecules/BottomSheet';
import { useState, useEffect } from 'react';

export type LoginState =
  | 'default'
  | 'withInvitationContext'
  | 'loading'
  | 'socialFailed'
  | 'socialCancelled'
  | 'accountBlocked'
  | 'withdrawnAccount'
  | 'sessionExpiredModal'
  | 'loginRequiredBottomSheet'
  | 'continueWithoutLogin';

export interface LoginProps {
  state?: LoginState;
  loadingProvider?: SocialProvider | null;
  invitationTitle?: string;
  onLogin?: (provider: SocialProvider) => void;
  onContinueWithoutLogin?: () => void;
}

const PROVIDERS: SocialProvider[] = ['kakao', 'naver', 'google', 'apple'];

export const Login = ({
  state = 'default',
  loadingProvider = null,
  invitationTitle,
  onLogin,
  onContinueWithoutLogin,
}: LoginProps) => {
  const [mounted, setMounted] = useState(false);
  const [sessionModalOpen, setSessionModalOpen] = useState(
    state === 'sessionExpiredModal',
  );
  const [loginSheetOpen, setLoginSheetOpen] = useState(
    state === 'loginRequiredBottomSheet',
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <main className="relative mx-auto flex min-h-screen w-full max-w-md flex-col overflow-hidden bg-black">
      <Image
        src="/onboarding_y2k.png"
        alt=""
        fill
        priority
        className="object-cover object-[center_calc(50%-120px)]"
        sizes="(max-width: 448px) 100vw, 448px"
      />

      <div className="relative z-10 mt-auto flex flex-col gap-2.5 px-page pb-[calc(env(safe-area-inset-bottom)+24px)]">
        {state === 'withInvitationContext' && invitationTitle ? (
          <p className="mb-1 text-center text-[13px] font-medium text-cranberry-60">
            <span className="rounded-full bg-white/90 px-3 py-1 shadow-sm backdrop-blur-sm">
              {invitationTitle}에 초대받았어요
            </span>
          </p>
        ) : null}

        {PROVIDERS.map((provider) => (
          <SocialLoginButton
            key={provider}
            provider={provider}
            loading={loadingProvider === provider}
            disabled={loadingProvider !== null}
            onClick={() => onLogin?.(provider)}
          />
        ))}

        {state === 'withInvitationContext' ||
        state === 'continueWithoutLogin' ? (
          <Button variant="text" size="md" onClick={onContinueWithoutLogin}>
            로그인 없이 초대장만 보기
          </Button>
        ) : null}

        <p className="mt-2 text-center text-[12px] text-white/80 drop-shadow-sm">
          시작 시{' '}
          <Link href={ROUTES.TERMS.SERVICE} className="underline">
            이용약관
          </Link>
          ·
          <Link href={ROUTES.TERMS.PRIVACY} className="underline">
            개인정보처리방침
          </Link>
          에 동의하게 됩니다
        </p>
      </div>

      <ConfirmModal
        contained
        open={sessionModalOpen}
        onOpenChange={setSessionModalOpen}
        title="다시 로그인해주세요"
        description="보안을 위해 일정 시간이 지나면 로그아웃돼요."
        confirmLabel="확인"
        onConfirm={() => setSessionModalOpen(false)}
      />

      {mounted && (
        <BottomSheet
          open={loginSheetOpen}
          onOpenChange={setLoginSheetOpen}
          modal={false}
          noBodyStyles
        >
          <BottomSheetContent
            contained
            title="로그인이 필요해요"
            description="이 기능을 쓰려면 먼저 로그인해주세요"
          >
            <div className="flex flex-col gap-2 pt-2">
              {PROVIDERS.map((provider) => (
                <SocialLoginButton
                  key={provider}
                  provider={provider}
                  loading={loadingProvider === provider}
                  disabled={loadingProvider !== null}
                  onClick={() => onLogin?.(provider)}
                />
              ))}
            </div>
          </BottomSheetContent>
        </BottomSheet>
      )}
    </main>
  );
};

'use client';

import { useState, useEffect } from 'react';
import { Login, type LoginState } from '@/screens/Login';
import type { SocialProvider } from '@/components/primitives/SocialLoginButton/providers';
import { toast } from '@wara/ui';
import { API_BASE } from '@/lib/env';

const AUTH_ERROR_STATE: Record<string, LoginState> = {
  cancelled: 'socialCancelled',
  failed: 'socialFailed',
};

const ERROR_MESSAGES: Partial<Record<LoginState, string>> = {
  socialFailed: '로그인에 실패했어요. 잠시 후 다시 시도해주세요.',
  socialCancelled: '로그인이 취소되었어요.',
  accountBlocked: '이용이 제한된 계정이에요. 고객센터에 문의해주세요.',
  withdrawnAccount: '탈퇴한 계정이에요. 30일 후 다시 가입할 수 있어요.',
};

export default function LoginContainer() {
  const [state, setState] = useState<LoginState>('default');
  const [loadingProvider, setLoadingProvider] = useState<SocialProvider | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const authError = params.get('auth_error');
    if (authError) {
      setState(AUTH_ERROR_STATE[authError] ?? 'socialFailed');
      window.history.replaceState({}, '', '/login');
    }
  }, []);

  useEffect(() => {
    const message = ERROR_MESSAGES[state];
    if (message) {
      toast.error(message);
      setState('default');
    }
  }, [state]);

  function handleLogin(provider: SocialProvider) {
    setLoadingProvider(provider);
    window.location.href = `${API_BASE}/auth/${provider}/redirect`;
  }

  return (
    <Login
      state={state}
      loadingProvider={loadingProvider}
      onLogin={handleLogin}
    />
  );
}

'use client';

import { useState, useEffect } from 'react';
import { Login, type LoginState } from '@/screens/Login';
import { toast } from '@/components/molecules/Toast';
import { API_BASE } from '@/lib/env';

const AUTH_ERROR_STATE: Record<string, LoginState> = {
  cancelled: 'socialCancelled',
  failed: 'socialFailed',
};

export default function LoginContainer() {
  const [state, setState] = useState<LoginState>('default');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const authError = params.get('auth_error');
    const reason = params.get('reason');
    if (authError) {
      setState(AUTH_ERROR_STATE[authError] ?? 'socialFailed');
      window.history.replaceState({}, '', '/login');
    } else if (reason === 'suspicious') {
      toast.error('의심스러운 활동이 감지돼 자동 로그아웃됐어요. 다시 로그인해주세요.');
      window.history.replaceState({}, '', '/login');
    }
  }, []);


  function handleKakao() {
    setState('kakaoLoading');
    window.location.href = `${API_BASE}/auth/kakao/redirect`;
  }

  function handleNaver() {
    setState('naverLoading');
    window.location.href = `${API_BASE}/auth/naver/redirect`;
  }

  function handleGoogle() {
    setState('googleLoading');
    window.location.href = `${API_BASE}/auth/google/redirect`;
  }

  function handleApple() {
    setState('appleLoading');
    window.location.href = `${API_BASE}/auth/apple/redirect`;
  }

  return (
    <Login
      state={state}
      onKakao={handleKakao}
      onNaver={handleNaver}
      onGoogle={handleGoogle}
      onApple={handleApple}
    />
  );
}

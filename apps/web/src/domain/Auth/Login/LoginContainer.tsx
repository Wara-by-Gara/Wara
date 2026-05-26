'use client';

import { useState } from 'react';
import { Login, type LoginState } from '@/screens/Login';

const API_BASE = `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'}/api`;

export default function LoginContainer() {
  const [state, setState] = useState<LoginState>('default');

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

  return (
    <Login
      state={state}
      onKakao={handleKakao}
      onNaver={handleNaver}
      onGoogle={handleGoogle}
    />
  );
}

'use client';

import { KakaoLoginButton } from '@/components/auth/kakao-login-button';
import { NaverLoginButton } from '@/components/auth/naver-login-button';
import { GoogleLoginButton } from '@/components/auth/google-login-button';

export default function LoginContainer() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-center mb-2">WARA</h1>
        <p className="text-sm text-gray-400 text-center mb-10">요즘 모이는 방식</p>

        <div className="flex flex-col gap-3">
          <KakaoLoginButton />
          <NaverLoginButton />
          <GoogleLoginButton />
        </div>
      </div>
    </div>
  );
}

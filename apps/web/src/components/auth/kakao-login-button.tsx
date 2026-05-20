'use client';

import { SocialLoginButton } from './social-login-button';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

function KakaoIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 3C6.477 3 2 6.582 2 11c0 2.795 1.628 5.258 4.1 6.79L5.2 21l4.37-2.31c.79.15 1.6.23 2.43.23 5.523 0 10-3.582 10-8S17.523 3 12 3z"
        fill="#3C1E1E"
      />
    </svg>
  );
}

export function KakaoLoginButton() {
  return (
    <SocialLoginButton
      icon={<KakaoIcon />}
      label="카카오로 계속하기"
      onClick={() => { window.location.href = `${API_URL}/auth/kakao/redirect`; }}
      className="bg-[#FEE500] text-[#3C1E1E] hover:bg-[#F5DC00]"
    />
  );
}

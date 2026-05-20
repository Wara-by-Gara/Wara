'use client';

import { SocialLoginButton } from './social-login-button';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

function NaverIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M13.517 12.518L10.175 7H7v10h3.483V11.48L13.825 17H17V7h-3.483v5.518z"
        fill="white"
      />
    </svg>
  );
}

export function NaverLoginButton() {
  return (
    <SocialLoginButton
      icon={<NaverIcon />}
      label="네이버로 계속하기"
      onClick={() => { window.location.href = `${API_URL}/auth/naver/redirect`; }}
      className="bg-[#03C75A] text-white hover:bg-[#02B350]"
    />
  );
}

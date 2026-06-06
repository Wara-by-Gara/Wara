'use client';

import { useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';

export function useOAuthCallback() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const login = useAuthStore((s) => s.login);

  useEffect(() => {
    if (searchParams.get('auth_success') === '1') {
      login();
      const originalReturnTo = sessionStorage.getItem('wara_oauth_return') ?? '/';
      sessionStorage.removeItem('wara_oauth_return');
      const hasSeenOnboarding = localStorage.getItem('wara_onboarding_done');
      const returnTo = hasSeenOnboarding ? originalReturnTo : '/onboarding';
      // 약관 미동의 사용자는 lib/api/client.ts의 403 인터셉터가 /terms/agree로 보냄
      router.replace(returnTo);
    }
  }, [searchParams, login, router, pathname]);
}

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
      router.replace(returnTo);
    }
  }, [searchParams, login, router, pathname]);
}

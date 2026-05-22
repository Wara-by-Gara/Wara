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
    const accessToken = searchParams.get('access_token');
    const refreshToken = searchParams.get('refresh_token');

    if (accessToken && refreshToken) {
      login(accessToken, refreshToken);
      router.replace(pathname);
    }
  }, [searchParams, login, router, pathname]);
}

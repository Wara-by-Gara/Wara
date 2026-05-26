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
      router.replace(pathname);
    }
  }, [searchParams, login, router, pathname]);
}

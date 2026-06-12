'use client';

import { useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { getMyAgreements, getTerms } from '@/lib/api/terms';

export function useOAuthCallback() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const login = useAuthStore((s) => s.login);

  useEffect(() => {
    if (searchParams.get('auth_success') !== '1') return;

    login();

    void (async () => {
      const originalReturnTo = sessionStorage.getItem('wara_oauth_return') ?? '/';
      sessionStorage.removeItem('wara_oauth_return');
      const hasSeenOnboarding = localStorage.getItem('wara_onboarding_done');
      const returnTo = hasSeenOnboarding ? originalReturnTo : '/onboarding';

      try {
        const [terms, agreements] = await Promise.all([getTerms(), getMyAgreements()]);
        const agreedIds = new Set(agreements.map((a) => a.termId));
        const pendingRequired = terms.filter((t) => t.isRequired && !agreedIds.has(t.id));
        if (pendingRequired.length > 0) {
          const encoded = encodeURIComponent(returnTo);
          router.replace(`/terms/agree?returnTo=${encoded}`);
          return;
        }
      } catch {
        // 약관 조회 실패 시 기존 홈 이동 (client.ts 403 fallback 유지)
      }

      router.replace(returnTo);
    })();
  }, [searchParams, login, router, pathname]);
}

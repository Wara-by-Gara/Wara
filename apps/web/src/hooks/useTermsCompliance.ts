'use client';

import { useEffect, useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTerms, useMyAgreements } from '@/hooks/useTerms';
import { useAuthStore } from '@/stores/authStore';

const TERMS_AGREE_PATH = '/terms/agree';

export function useTermsCompliance() {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const { data: terms, isLoading: termsLoading } = useTerms();
  const { data: agreements, isLoading: agreementsLoading } = useMyAgreements();

  const isCompliant = useMemo(() => {
    if (!isLoggedIn) return true;
    if (!terms || agreements === undefined) return null;
    const agreedIds = new Set(agreements.map((a) => a.termId));
    return terms.filter((t) => t.isRequired).every((t) => agreedIds.has(t.id));
  }, [isLoggedIn, terms, agreements]);

  return {
    isCompliant,
    isLoading: isLoggedIn && (termsLoading || agreementsLoading),
  };
}

/** 로그인 사용자가 필수 약관 미동의면 /terms/agree로 보낸다. */
export function useTermsComplianceRedirect() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const { isCompliant, isLoading } = useTermsCompliance();

  useEffect(() => {
    if (!isLoggedIn || isLoading || isCompliant !== false) return;
    if (pathname.startsWith(TERMS_AGREE_PATH)) return;
    const returnTo = encodeURIComponent(pathname + (searchParams.toString() ? `?${searchParams}` : ''));
    router.replace(`${TERMS_AGREE_PATH}?returnTo=${returnTo}`);
  }, [isLoggedIn, isLoading, isCompliant, pathname, searchParams, router]);
}

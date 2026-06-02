import { useEffect } from 'react';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { fetchTerms, fetchMyAgreements, termsKeys } from '@/api/terms';

export function useTermsGuard() {
  const { data: terms } = useQuery({
    queryKey: termsKeys.list(),
    queryFn: ({ signal }) => fetchTerms(signal),
  });
  const { data: myAgreements } = useQuery({
    queryKey: termsKeys.myAgreements(),
    queryFn: ({ signal }) => fetchMyAgreements(signal),
    retry: false,
  });

  useEffect(() => {
    if (!terms || !myAgreements) return;
    const pendingRequired = terms.filter(
      (t) => t.isRequired && !myAgreements.some((a) => a.termId === t.id),
    );
    if (pendingRequired.length > 0) {
      router.replace('/terms-agree');
    }
  }, [terms, myAgreements]);
}

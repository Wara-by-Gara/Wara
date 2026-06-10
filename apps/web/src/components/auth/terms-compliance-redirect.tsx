'use client';

import { Suspense } from 'react';
import { useTermsComplianceRedirect } from '@/hooks/useTermsCompliance';

function TermsComplianceRedirectInner() {
  useTermsComplianceRedirect();
  return null;
}

export function TermsComplianceRedirect() {
  return (
    <Suspense fallback={null}>
      <TermsComplianceRedirectInner />
    </Suspense>
  );
}

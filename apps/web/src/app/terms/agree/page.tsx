import { Suspense } from 'react';
import { TermsAgreeSkeleton } from '@/components/domain/Skeleton';
import { TermsAgreeContainer } from '@/domain/Terms/TermsAgreeContainer';

export default function TermsAgreePage() {
  return (
    <Suspense fallback={<TermsAgreeSkeleton />}>
      <TermsAgreeContainer />
    </Suspense>
  );
}

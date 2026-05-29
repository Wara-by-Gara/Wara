import { Suspense } from 'react';
import InvitationListContainer from '@/domain/InvitationList/Container/InvitationListContainer';

export default function InvitationsPage() {
  return (
    <Suspense fallback={null}>
      <InvitationListContainer />
    </Suspense>
  );
}

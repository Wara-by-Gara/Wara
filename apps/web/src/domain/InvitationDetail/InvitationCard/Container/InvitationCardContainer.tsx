'use client';

import { useInvitation } from '@/hooks/useInvitations';
import { InvitationDetailProps } from '../../types';
import DetailCard from '../DetailCard/DetailCard';

export default function InvitationCardContainer({
  invitationId,
}: InvitationDetailProps) {
  const { data, isLoading } = useInvitation(invitationId);

  if (isLoading) return <div>로딩중...</div>;
  if (!data) return null;
  return (
    <>
      <DetailCard invitation={data} />
    </>
  );
}

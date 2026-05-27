import InvitationDetailContainer from '@/domain/InvitationDetail/Container/InvitationDetailContainer';

interface Props {
  params: Promise<{ invitationId: string }>;
}

export default async function InvitationsDetailPage({ params }: Props) {
  const { invitationId } = await params;
  return <InvitationDetailContainer invitationId={invitationId} />;
}

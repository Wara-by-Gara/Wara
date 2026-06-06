import PublicInvitationContainer from "@/domain/PublicInvitation/PublicInvitationContainer";

interface Props {
  params: Promise<{ invitationId: string }>;
}

export default async function PublicInvitationPage({ params }: Props) {
  const { invitationId } = await params;

  return <PublicInvitationContainer invitationId={invitationId} />;
}

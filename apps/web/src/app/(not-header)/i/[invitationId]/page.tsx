import type { Metadata } from "next";
import { getInvitation } from "@/lib/api/invitations";
import PublicInvitationContainer from "@/domain/PublicInvitation/PublicInvitationContainer";

interface Props {
  params: Promise<{ invitationId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { invitationId } = await params;
  try {
    const invitation = await getInvitation(invitationId);
    return {
      title: invitation.title,
      description: invitation.description,
      openGraph: {
        title: invitation.title,
        description: invitation.description,
        type: "website",
      },
    };
  } catch {
    return { title: "초대장" };
  }
}

export default async function PublicInvitationPage({ params }: Props) {
  const { invitationId } = await params;
  const invitation = await getInvitation(invitationId);

  return <PublicInvitationContainer invitation={invitation} />;
}

import type { Metadata } from "next";
import { getInvitation } from "@/lib/api/invitations";

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

  return (
    <div>
      <h1>{invitation.title}</h1>
    </div>
  );
}

import { Comments } from "@/screens/Comments/Comments";

interface Props {
  params: Promise<{ invitationId: string }>;
}

export default async function CommentsPage({ params }: Props) {
  const { invitationId } = await params;
  return <Comments invitationId={invitationId} />;
}

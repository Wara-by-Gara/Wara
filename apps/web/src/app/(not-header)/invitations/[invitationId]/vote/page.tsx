import { DateVote } from "@/screens/DateVote/DateVote";

interface Props {
  params: Promise<{ invitationId: string }>;
}

export default async function DateVotePage({ params }: Props) {
  const { invitationId } = await params;
  return <DateVote invitationId={invitationId} />;
}

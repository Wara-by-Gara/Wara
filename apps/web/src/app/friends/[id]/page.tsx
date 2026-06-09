import { FriendProfile } from "@/screens/FriendProfile/FriendProfile";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function FriendProfilePage({ params }: Props) {
  const { id } = await params;
  return <FriendProfile id={id} />;
}

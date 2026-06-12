import { ChatRoom } from "@/screens/Chat/ChatRoom";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ChatRoomPage({ params }: Props) {
  const { id } = await params;
  return <ChatRoom id={id} />;
}

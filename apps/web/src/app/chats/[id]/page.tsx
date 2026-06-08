"use client";

import { useParams } from "next/navigation";
import { ChatRoom } from "@/screens/Chat/ChatRoom";

export default function ChatRoomPage() {
  const params = useParams();
  const id = params.id as string;
  return <ChatRoom id={id} />;
}

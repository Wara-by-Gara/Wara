"use client";

import { useParams } from "next/navigation";
import { FriendProfile } from "@/screens/FriendProfile/FriendProfile";
import { getMockFriendProfile } from "@/lib/mockData";

export default function FriendProfilePage() {
  const params = useParams();
  const id = params.id as string;
  return <FriendProfile friend={getMockFriendProfile(id)} />;
}

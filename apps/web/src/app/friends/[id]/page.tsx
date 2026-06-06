"use client";

import { useParams } from "next/navigation";
import { FriendProfile } from "@/screens/FriendProfile/FriendProfile";

export default function FriendProfilePage() {
  const params = useParams();
  const id = params.id as string;
  return <FriendProfile id={id} />;
}

import { Suspense } from "react";
import { Friends } from "@/screens/Friends/Friends";

export default function FriendsPage() {
  return (
    <Suspense>
      <Friends />
    </Suspense>
  );
}

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { InvitationList } from "@/screens/InvitationList";
import { getMyInvitations } from "@/lib/api/invitations";
import { useAuthStore } from "@/stores/authStore";

export default function InvitationListContainer() {
  const router = useRouter();
  const { isLoggedIn, hydrated, hydrate } = useAuthStore();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") ?? "" : "";

  const { data, isLoading, isError } = useQuery({
    queryKey: ["my-invitations"],
    queryFn: () => getMyInvitations(token),
    enabled: hydrated && isLoggedIn,
    retry: 1,
  });

  if (!hydrated) return null;

  if (!isLoggedIn) {
    return (
      <InvitationList
        state="empty"
        invitations={[]}
        onBack={() => router.back()}
      />
    );
  }

  if (isLoading) {
    return <InvitationList state="loading" invitations={[]} />;
  }

  if (isError) {
    return <InvitationList state="error" invitations={[]} />;
  }

  const invitations = (data ?? []).map((inv) => ({
    id: inv.id,
    title: inv.title,
    description: "",
    date: inv.eventStartAt
      ? new Date(inv.eventStartAt).toLocaleDateString("ko-KR", {
          month: "long",
          day: "numeric",
          weekday: "short",
        })
      : "",
    location: inv.eventLocation?.placeName ?? "",
    coverImageUrl: inv.mainImageUrl ?? "",
    host: { name: "" },
    variant: "createdByMe" as const,
  }));

  return (
    <InvitationList
      state={invitations.length === 0 ? "empty" : "default"}
      invitations={invitations}
      onBack={() => router.back()}
      onCardClick={(id) => router.push(`/invitations/${id}`)}
    />
  );
}

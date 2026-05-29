"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { InvitationList, type InvitationListTab } from "@/screens/InvitationList";
import { getMyInvitations } from "@/lib/api/invitations";
import { useAuthStore } from "@/stores/authStore";
import { ROUTES } from "@/constants/routes";

export default function InvitationListContainer() {
  const router = useRouter();
  const { isLoggedIn, hydrated, hydrate } = useAuthStore();
  const [tab, setTab] = useState<InvitationListTab>("all");

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["my-invitations"],
    queryFn: () => getMyInvitations(),
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
        onCreateClick={() => router.push(ROUTES.INVITATIONS.CREATE)}
      />
    );
  }

  if (isLoading) {
    return <InvitationList state="loading" invitations={[]} />;
  }

  if (isError) {
    return <InvitationList state="error" invitations={[]} />;
  }

  const all = (data ?? []).map((inv) => ({
    id: inv.id,
    title: inv.title,
    description: "",
    date: inv.eventStartAt
      ? new Date(inv.eventStartAt).toLocaleDateString("ko-KR", {
          month: "long",
          day: "numeric",
          weekday: "short",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "",
    location: inv.eventLocation?.placeName ?? "",
    coverImageUrl: inv.mainImageUrl ?? "",
    host: { name: "" },
    _status: inv.status,
    _myRole: inv.myRole,
    variant: (inv.myRole === "HOST" ? "createdByMe" : "invited") as "createdByMe" | "invited",
  }));

  const filtered = all
    .filter((inv) => {
      if (tab === "createdByMe") return inv._myRole === "HOST" && inv._status !== "closed";
      if (tab === "joined") return inv._myRole === "GUEST" && inv._status !== "closed";
      if (tab === "ended") return inv._status === "closed";
      return inv._status !== "closed";
    })
    .map(({ _status: _s, _myRole: _r, ...rest }) => rest);

  return (
    <InvitationList
      tab={tab}
      onTabChange={setTab}
      state={filtered.length === 0 ? "empty" : "default"}
      invitations={filtered}
      onBack={() => router.back()}
      onCardClick={(id) => router.push(ROUTES.INVITATIONS.DETAIL(id))}
      onCreateClick={() => router.push(ROUTES.INVITATIONS.CREATE)}
    />
  );
}

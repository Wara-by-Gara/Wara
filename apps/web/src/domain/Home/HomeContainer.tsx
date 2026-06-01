"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Icon } from "@/components/icons";
import { Button } from "@/components/primitives/Button";
import { Avatar } from "@/components/primitives/Avatar";
import { TopAppBar } from "@/components/molecules/TopAppBar";
import { StickyHeader } from "@/components/layout/StickyHeader";
import { NotificationBellContainer } from "@/domain/Notifications/NotificationBell/NotificationBellContainer";
import { InvitationListSection } from "@/domain/InvitationList/InvitationListSection";
import {
  filterInvitationsByTab,
  mapInvitationsToListItems,
  type InvitationListTab,
} from "@/domain/InvitationList/invitationListUtils";
import { useAuthStore } from "@/stores/authStore";
import { getMyInvitations } from "@/lib/api/invitations";
import { getMe } from "@/lib/api/users";
import { ROUTES } from "@/constants/routes";

export default function HomeContainer() {
  const router = useRouter();
  const { isLoggedIn, hydrated, hydrate } = useAuthStore();
  const [tab, setTab] = useState<InvitationListTab>("all");

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const { data: me } = useQuery({
    queryKey: ["me"],
    queryFn: getMe,
    enabled: hydrated && isLoggedIn,
    retry: 1,
  });

  const { data: invitations, isLoading, isError } = useQuery({
    queryKey: ["my-invitations"],
    queryFn: getMyInvitations,
    enabled: hydrated && isLoggedIn,
    retry: 1,
  });

  const mapped = useMemo(() => mapInvitationsToListItems(invitations ?? []), [invitations]);

  const filtered = useMemo(() => filterInvitationsByTab(mapped, tab), [mapped, tab]);

  const listState = isLoading ? "loading" : isError ? "error" : filtered.length === 0 ? "empty" : "default";

  if (!hydrated) return null;

  if (!isLoggedIn) {
    return (
      <div className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col overflow-hidden bg-background">
        <TopAppBar brandLogo brandLogoCompact />
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
          <Icon name="pixel-heart" size="xl" color="primary" decorative />
          <h1 className="text-[24px] font-extrabold text-text-primary">초대장을 더 특별하게</h1>
          <p className="text-[14px] text-text-secondary">로그인하고 첫 초대장을 만들어보세요</p>
          <Button variant="primary" size="lg" className="mt-2" onClick={() => router.push(ROUTES.INVITATIONS.CREATE)}>
            시작하기
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative mx-auto flex h-full min-h-full w-full max-w-md flex-col overflow-x-hidden bg-background-soft">
      <StickyHeader
        brandLogo
        brandLogoCompact
        rightSlot={
          <>
            <NotificationBellContainer />
            <Avatar
              size="sm"
              src={me?.profileImageUrl ?? undefined}
              alt={me?.name ?? me?.nickname ?? ""}
              name={me?.name ?? me?.nickname ?? undefined}
            />
          </>
        }
      />

      <main className="relative z-10 min-h-0 flex-1 overflow-y-auto pt-14">
        <div className="flex flex-col gap-8 pb-6">
          <div className="flex flex-col gap-1.5 px-5 pt-3">
            <h2 className="font-gmarket text-[22px] font-medium leading-tight text-white">
              안녕하세요, {me?.name ?? me?.nickname ?? ""}님!
            </h2>
            <p className="font-gmarket text-[15px] leading-tight text-white">
              오늘도 즐거운 모임 되세요👋
            </p>
          </div>
          <div className="px-5">
            <InvitationListSection
              tab={tab}
              onTabChange={setTab}
              state={listState}
              invitations={filtered}
              onCardClick={(id) => router.push(ROUTES.INVITATIONS.DETAIL(id))}
              onCreateClick={() => router.push(ROUTES.INVITATIONS.CREATE)}
              columns={2}
            />
          </div>
        </div>
      </main>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Icon } from "@/components/icons";
import { Button } from "@/components/primitives/Button";
import { Avatar } from "@/components/primitives/Avatar";
import { AutoSlide } from "@/components/molecules/AutoSlide";
import { TopAppBar } from "@/components/molecules/TopAppBar";
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
import { mockTemplateSlides } from "@/lib/mockData";
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
        <TopAppBar brandLogo title="WARA" />
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
      <TopAppBar
        className="shrink-0"
        title="WARA"
        largeTitle
        brandLogo
        rightSlot={
          <>
            <NotificationBellContainer />
            <Avatar
              size="sm"
              src={me?.profileImageUrl ?? undefined}
              alt={me?.name ?? me?.nickname ?? ""}
              initial={(me?.name ?? me?.nickname)?.[0]}
            />
          </>
        }
      />

      <main className="min-h-0 flex-1 overflow-y-auto">
        <div className="flex flex-col gap-5 pb-6">
          <AutoSlide
            slides={mockTemplateSlides}
            intervalMs={2500}
            aspectClassName="aspect-[16/9]"
            rounded={false}
          />
          <div className="px-5">
            <InvitationListSection
              tab={tab}
              onTabChange={setTab}
              state={listState}
              invitations={filtered}
              onCardClick={(id) => router.push(ROUTES.INVITATIONS.DETAIL(id))}
              onCreateClick={() => router.push(ROUTES.INVITATIONS.CREATE)}
            />
          </div>
        </div>
      </main>
    </div>
  );
}

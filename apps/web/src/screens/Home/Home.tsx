"use client";

import { Icon } from "@/components/icons";
import { Button } from "@/components/primitives/Button";
import { Avatar } from "@/components/primitives/Avatar";
import { TopAppBar } from "@/components/molecules/TopAppBar";
import { HeaderGradient } from "@/components/layout/StickyHeader";
import { InvitationListSection } from "@/domain/InvitationList/InvitationListSection";
import type { InvitationListTab } from "@/domain/InvitationList/invitationListUtils";
import type { InvitationListSectionState } from "@/domain/InvitationList/InvitationListSection";
import { NotificationBellContainer } from "@/domain/Notifications/NotificationBell/NotificationBellContainer";
import { mockInvitation, mockMe, type MockInvitation, type MockUser } from "@/lib/mockData";
import type { InvitationCardVariant } from "@/components/organisms/InvitationCard";
import { cn } from "@/lib/cn";
import { useState } from "react";

export type HomeState =
  | "guestLanding"
  | "loggedInEmpty"
  | "loggedInFilled"
  | "loadingSkeleton"
  | "networkError";

export interface HomeProps {
  state?: HomeState;
  me?: MockUser;
  tab?: InvitationListTab;
  invitations?: (MockInvitation & { variant?: InvitationCardVariant })[];
}

const sample = [
  { ...mockInvitation, variant: "upcoming" as const },
  {
    ...mockInvitation,
    id: "inv2",
    title: "주말 브런치",
    date: "5월 25일 일요일 · 오전 11시",
    coverImageUrl: "https://placehold.co/640x360/FFE47A/171717?text=Brunch",
    variant: "upcoming" as const,
  },
];

export const Home = ({
  state = "loggedInFilled",
  me = mockMe,
  tab: tabProp = "all",
  invitations = sample,
}: HomeProps) => {
  const [tab, setTab] = useState(tabProp);

  if (state === "guestLanding") {
    return (
      <div className="relative mx-auto flex h-full min-h-full w-full max-w-md flex-col overflow-hidden bg-background">
        <TopAppBar className="absolute inset-x-0 top-0 z-30" brandLogo brandLogoCompact />
        <section className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
          <Icon name="pixel-heart" size="xl" color="primary" decorative />
          <h1 className="text-[24px] font-extrabold text-text-primary">초대장을 더 특별하게</h1>
          <p className="text-[14px] text-text-secondary">로그인하고 첫 초대장을 만들어보세요</p>
          <Button variant="primary" size="lg" className="mt-2">
            시작하기
          </Button>
        </section>
      </div>
    );
  }

  const listState: InvitationListSectionState =
    state === "loadingSkeleton"
      ? "loading"
      : state === "networkError"
        ? "error"
        : state === "loggedInEmpty"
          ? "empty"
          : "default";

  const listItems = invitations.map((inv) => ({
    id: inv.id,
    title: inv.title,
    description: inv.description ?? "",
    date: inv.date,
    location: inv.location,
    coverImageUrl: inv.coverImageUrl ?? "",
    host: inv.host,
    variant: inv.variant,
  }));

  return (
    <div className="relative mx-auto flex h-full min-h-full w-full max-w-md flex-col overflow-x-hidden bg-background-soft">
      <HeaderGradient fixed />
      <TopAppBar
        className="absolute inset-x-0 top-0 z-30"
        variant="transparent"
        brandLogo
        brandLogoCompact
        rightSlot={
          <>
            <NotificationBellContainer />
            <Avatar size="sm" src={me.avatarUrl} alt={me.nickname} name={me.name ?? me.nickname} />
          </>
        }
      />

      <main className="relative z-10 min-h-0 flex-1 overflow-y-auto pt-14">
        <div className="flex flex-col gap-5 pb-6">
          <div className="flex flex-col gap-1.5 px-5 pt-3">
            <h2 className="font-gmarket text-[22px] font-bold leading-tight text-white">
              안녕하세요, {me.name ?? me.nickname}님!
            </h2>
            <p className="font-gmarket text-[15px] leading-tight text-white">
              오늘도 즐거운 모임 되세요👋
            </p>
          </div>
          <div className={cn("px-5", (state === "networkError" || state === "loggedInEmpty") && "flex min-h-[40vh] flex-col justify-center")}>
            <InvitationListSection
              tab={tab}
              onTabChange={setTab}
              state={listState}
              invitations={listItems}
              columns={2}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

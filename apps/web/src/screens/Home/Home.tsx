"use client";

import { Icon } from "@/components/icons";
import { Button } from "@/components/primitives/Button";
import { Avatar } from "@/components/primitives/Avatar";
import { AutoSlide } from "@/components/molecules/AutoSlide";
import { TopAppBar } from "@/components/molecules/TopAppBar";
import { InvitationListSection } from "@/domain/InvitationList/InvitationListSection";
import type { InvitationListTab } from "@/domain/InvitationList/invitationListUtils";
import type { InvitationListSectionState } from "@/domain/InvitationList/InvitationListSection";
import { NotificationBellContainer } from "@/domain/Notifications/NotificationBell/NotificationBellContainer";
import { mockInvitation, mockMe, mockTemplateSlides, type MockInvitation, type MockUser } from "@/lib/mockData";
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
      <div className="mx-auto flex h-full min-h-full w-full max-w-md flex-col overflow-hidden bg-background">
        <TopAppBar title="Wara" brandLogo />
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
      <TopAppBar
        className="shrink-0"
        title="WARA"
        largeTitle
        brandLogo
        rightSlot={
          <>
            <NotificationBellContainer />
            <Avatar size="sm" src={me.avatarUrl} alt={me.nickname} name={me.name ?? me.nickname} />
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
          <div className={cn("px-5", (state === "networkError" || state === "loggedInEmpty") && "flex min-h-[40vh] flex-col justify-center")}>
            <InvitationListSection
              tab={tab}
              onTabChange={setTab}
              state={listState}
              invitations={listItems}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

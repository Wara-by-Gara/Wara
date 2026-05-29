"use client";

import { Icon } from "@/components/icons";
import { TopAppBar } from "@/components/molecules/TopAppBar";
import { InvitationListSection } from "@/domain/InvitationList/InvitationListSection";
import {
  INVITATION_LIST_TAB_LABELS,
  type InvitationListTab,
} from "@/domain/InvitationList/invitationListUtils";
import type { InvitationListSectionState } from "@/domain/InvitationList/InvitationListSection";
import { mockInvitation, type MockInvitation } from "@/lib/mockData";
import type { InvitationCardVariant } from "@/components/organisms/InvitationCard";

export type { InvitationListTab };
export { INVITATION_LIST_TAB_LABELS as TAB_LABELS };

export type InvitationListState =
  | "default"
  | "empty"
  | "loading"
  | "error";

export interface InvitationListProps {
  tab?: InvitationListTab;
  onTabChange?: (tab: InvitationListTab) => void;
  state?: InvitationListState;
  invitations?: (MockInvitation & { variant?: InvitationCardVariant })[];
  onBack?: () => void;
  onCardClick?: (id: string) => void;
  onCreateClick?: () => void;
}

const sample = [
  mockInvitation,
  {
    ...mockInvitation,
    id: "i2",
    title: "주말 브런치",
    date: "5월 25일 일요일 · 오전 11시",
    coverImageUrl: "https://placehold.co/640x360/FFE47A/171717?text=Brunch",
  },
  {
    ...mockInvitation,
    id: "i3",
    title: "북클럽 1월",
    date: "6월 1일 · 오후 8시",
    coverImageUrl: "https://placehold.co/640x360/8DD4FF/171717?text=Book",
  },
];

export const InvitationList = ({
  tab = "all",
  onTabChange,
  state = "default",
  invitations = sample,
  onBack,
  onCardClick,
  onCreateClick,
}: InvitationListProps) => {
  const sectionState: InvitationListSectionState =
    state === "loading" ? "loading" : state === "error" ? "error" : state === "empty" ? "empty" : "default";

  const listItems = invitations.map((inv) => ({
    id: inv.id,
    title: inv.title,
    description: inv.description ?? "",
    date: inv.date,
    location: inv.location,
    coverImageUrl: inv.coverImageUrl ?? "",
    host: inv.host,
    variant: inv.variant ?? (tab === "ended" ? ("ended" as const) : undefined),
  }));

  return (
    <div className="relative mx-auto flex h-[100dvh] w-full max-w-md flex-col overflow-x-hidden bg-background-soft">
      <TopAppBar
        className="shrink-0"
        title="초대장"
        onBack={onBack}
        rightSlot={
          <button
            type="button"
            aria-label="검색"
            className="inline-flex size-11 items-center justify-center text-text-secondary"
          >
            <Icon name="search" size="lg" color="currentColor" decorative />
          </button>
        }
      />

      <main className="min-h-0 flex-1 overflow-y-auto px-5 py-3">
        <InvitationListSection
          tab={tab}
          onTabChange={onTabChange ?? (() => {})}
          state={sectionState}
          invitations={listItems}
          onCardClick={onCardClick}
          onCreateClick={onCreateClick}
        />
      </main>
    </div>
  );
};

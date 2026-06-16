"use client";

import { Chip, Button, EmptyState, ErrorState } from "@wara/ui";
import { InviteCard, statusChipToBadge } from "@/components/domain";
import { InvitationCardSkeleton } from "@/components/organisms/Skeleton";
import {
  INVITATION_LIST_TAB_LABELS,
  type InvitationListItem,
  type InvitationListTab,
} from "@/domain/InvitationList/invitationListUtils";
import { cn } from "@/lib/cn";

export type InvitationListSectionState = "default" | "empty" | "loading" | "error";

export interface InvitationListSectionProps {
  id?: string;
  tab: InvitationListTab;
  onTabChange: (tab: InvitationListTab) => void;
  state: InvitationListSectionState;
  invitations: InvitationListItem[];
  onCardClick?: (id: string) => void;
  onCreateClick?: () => void;
  className?: string;
  /** 카드 배치 열 수 (기본 1열, 홈은 2열) */
  columns?: 1 | 2;
}

export function InvitationListSection({
  id = "invitation-list",
  tab,
  onTabChange,
  state,
  invitations,
  onCardClick,
  onCreateClick,
  className,
  columns = 1,
}: InvitationListSectionProps) {
  const listClass = columns === 2 ? "grid grid-cols-2 gap-3" : "flex flex-col gap-3";
  return (
    <section id={id} className={cn("flex flex-col", className)}>
      <div className="flex flex-nowrap gap-1.5 overflow-x-auto scrollbar-hide">
        {(Object.keys(INVITATION_LIST_TAB_LABELS) as InvitationListTab[]).map((t) => (
          <Chip
            key={t}
            selected={t === tab}
            className="shrink-0"
            onClick={() => onTabChange(t)}
          >
            {INVITATION_LIST_TAB_LABELS[t]}
          </Chip>
        ))}
      </div>

      <div className="mt-3">
        {state === "loading" ? (
          <div className={listClass}>
            {Array.from({ length: columns === 2 ? 4 : 3 }).map((_, i) => (
              <InvitationCardSkeleton key={i} />
            ))}
          </div>
        ) : state === "error" ? (
          <ErrorState title="초대장 목록을 불러오지 못했어요" onRetry={() => {}} />
        ) : state === "empty" ? (
          <EmptyState
            icon="ticket"
            title="아직 초대장이 없어요"
            description="첫 모임을 Wara로 초대해보세요"
            action={<Button onClick={onCreateClick}>초대장 만들기</Button>}
          />
        ) : (
          <div className={listClass}>
            {invitations.map((inv) => (
              <InviteCard
                key={inv.id}
                title={inv.title}
                dateText={inv.date}
                locationText={inv.location}
                imageUrl={inv.coverImageUrl}
                badge={statusChipToBadge({
                  variant: inv.variant ?? (tab === "ended" ? "ended" : "default"),
                })}
                onClick={() => onCardClick?.(inv.id)}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

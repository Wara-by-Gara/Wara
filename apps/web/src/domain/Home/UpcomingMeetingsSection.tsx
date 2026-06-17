"use client";

import { useRouter } from "next/navigation";
import { InviteCard, statusChipToBadge } from "@/components/domain";
import { SectionHeader } from "@/components/layout/SectionHeader";
import { Button } from "@wara/ui";
import type { InvitationListItem } from "@/domain/InvitationList/invitationListUtils";
import { ROUTES } from "@/constants/routes";
import type { Invitation } from "@/lib/api/invitations";
import { HorizontalInvitationListSkeleton } from "@/components/domain/Skeleton";
import { resolveInvitationCardStatus } from "@/utils/resolveInvitationCardStatus";

interface UpcomingMeetingsSectionProps {
  items: InvitationListItem[];
  rawInvitations: Invitation[];
  isLoading?: boolean;
}

export function UpcomingMeetingsSection({
  items,
  rawInvitations,
  isLoading,
}: UpcomingMeetingsSectionProps) {
  const router = useRouter();
  const invitationMap = new Map(rawInvitations.map((inv) => [inv.id, inv]));

  return (
    <section className="home-section home-section-upcoming">
      <SectionHeader
        heading="다가오는 모임"
        action={
          <Button
            variant="text"
            size="sm"
            onClick={() => router.push(ROUTES.MEETINGS)}
          >
            전체보기
          </Button>
        }
      />
      <div className="home-section-content">
      {isLoading ? (
        <HorizontalInvitationListSkeleton count={3} />
      ) : items.length === 0 ? (
        <p className="type-empty rounded-md bg-surface px-4 py-6 text-center">
          다가오는 모임이 없어요
        </p>
      ) : (
        <div className="home-section-list flex flex-col divide-y divide-border">
          {items.map((inv) => {
            const raw = invitationMap.get(inv.id);
            const chip = resolveInvitationCardStatus({
              eventStartAt: raw?.eventStartAt,
              status: raw?.status === "closed" ? "closed" : "active",
            });

            return (
              <InviteCard
                key={inv.id}
                layout="horizontal"
                badge={statusChipToBadge(chip)}
                imageUrl={inv.coverImageUrl || undefined}
                title={inv.title}
                dateText={inv.date}
                locationText={inv.location}
                onClick={() => router.push(ROUTES.INVITATIONS.DETAIL(inv.id))}
                className="w-full text-left"
              />
            );
          })}
        </div>
      )}
      </div>
    </section>
  );
}

import type { Invitation } from "@/lib/api/invitations";
import type { InvitationCardVariant } from "@/utils/resolveInvitationCardStatus";
import {
  getInvitationCoverImageUrl,
  mapInvitationsToListItems,
  type InvitationListItem,
} from "@/domain/InvitationList/invitationListUtils";
import { formatInvitationCardDate } from "@/utils/formatInvitationEventDate";

export function getDdayLabel(eventStartAt: string): string {
  const start = new Date(eventStartAt);
  const today = new Date();
  start.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((start.getTime() - today.getTime()) / 86_400_000);
  if (diff === 0) return "D-Day";
  if (diff > 0) return `D-${diff}`;
  return `D+${Math.abs(diff)}`;
}

export function getUpcomingInvitations(
  invitations: Invitation[],
  limit = 3,
): InvitationListItem[] {
  const now = Date.now();
  return invitations
    .filter(
      (inv) =>
        inv.eventStartAt &&
        inv.status !== "closed" &&
        new Date(inv.eventStartAt).getTime() >= now,
    )
    .sort(
      (a, b) =>
        new Date(a.eventStartAt!).getTime() - new Date(b.eventStartAt!).getTime(),
    )
    .slice(0, limit)
    .map((inv) => ({
      id: inv.id,
      title: inv.title,
      description: "",
      date: formatInvitationCardDate(inv.eventStartAt),
      location: inv.eventLocation?.placeName ?? "",
      coverImageUrl: getInvitationCoverImageUrl(inv),
      host: { name: "" },
      variant: "upcoming" as InvitationCardVariant,
    }));
}

export function sortInvitationsByEventDate(invitations: Invitation[]): Invitation[] {
  return [...invitations]
    .filter((inv) => inv.eventStartAt && inv.status !== "closed")
    .sort(
      (a, b) =>
        new Date(a.eventStartAt!).getTime() - new Date(b.eventStartAt!).getTime(),
    );
}

export { mapInvitationsToListItems };

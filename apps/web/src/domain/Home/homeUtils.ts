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
  // 오늘 0시 기준 — 시작 시각이 지난 '당일' 모임도 종일 '다가오는'에 유지 (간헐 누락 방지)
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const threshold = startOfToday.getTime();
  return invitations
    .filter(
      (inv) =>
        inv.eventStartAt &&
        inv.status !== "closed" &&
        inv.myRsvpStatus !== "absent" &&
        new Date(inv.eventStartAt).getTime() >= threshold,
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
  const active = invitations.filter((inv) => inv.status !== "closed");
  // 날짜 있는 모임은 시간순, 날짜 미정 모임은 캘린더에 못 올리므로 말미에 노출
  const dated = active
    .filter((inv) => inv.eventStartAt)
    .sort(
      (a, b) =>
        new Date(a.eventStartAt!).getTime() - new Date(b.eventStartAt!).getTime(),
    );
  const undated = active.filter((inv) => !inv.eventStartAt);
  return [...dated, ...undated];
}

export { mapInvitationsToListItems };

import type { Invitation } from "@/lib/api/invitations";
import type { InvitationCardVariant } from "@/utils/resolveInvitationCardStatus";
import { formatInvitationEventDate } from "@/utils/formatInvitationEventDate";

export type InvitationListTab = "all" | "createdByMe" | "joined" | "ended";

export const INVITATION_LIST_TAB_LABELS: Record<InvitationListTab, string> = {
  all: "전체",
  createdByMe: "내가 만든",
  joined: "참여한",
  ended: "종료됨",
};

export type InvitationListItem = {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  coverImageUrl: string;
  host: { name: string };
  variant?: InvitationCardVariant;
  /** 가로 카드 주제 라벨 (없으면 생략) */
  subject?: string;
};

export type MappedInvitationListItem = InvitationListItem & {
  _status: string;
  _myRole?: "HOST" | "GUEST";
};

export function getInvitationCoverImageUrl(
  inv: Pick<Invitation, "mainCoverType" | "mainGifUrl" | "mainImageUrl">,
): string {
  return inv.mainCoverType === "gif" ? (inv.mainGifUrl ?? "") : (inv.mainImageUrl ?? "");
}

export function mapInvitationsToListItems(invitations: Invitation[]): MappedInvitationListItem[] {
  return invitations.map((inv) => ({
    id: inv.id,
    title: inv.title,
    description: "",
    date: formatInvitationEventDate(inv.eventStartAt),
    location: inv.eventLocation?.placeName ?? inv.eventLocation?.address ?? "미정",
    coverImageUrl: getInvitationCoverImageUrl(inv),
    host: { name: "" },
    _status: inv.status,
    _myRole: inv.myRole,
    variant: (inv.myRole === "HOST" ? "createdByMe" : "invited") as InvitationCardVariant,
  }));
}

export function filterInvitationsByTab(
  items: MappedInvitationListItem[],
  tab: InvitationListTab,
): InvitationListItem[] {
  return items
    .filter((inv) => {
      if (tab === "createdByMe") return inv._myRole === "HOST" && inv._status !== "closed";
      if (tab === "joined") return inv._myRole === "GUEST" && inv._status !== "closed";
      if (tab === "ended") return inv._status === "closed";
      return inv._status !== "closed";
    })
    .map(({ _status: _s, _myRole: _r, ...rest }) => rest);
}

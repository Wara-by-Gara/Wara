import type { RsvpStatus } from "@/lib/api/participants";

export interface InvitationDetailProps {
  invitationId: string;
  currentUserId?: string | null;
  currentUserDisplayName?: string | null;
  currentUserProfileImageUrl?: string | null;
}

export const FONT_CLASS: Record<string, string> = {
  default: "font-sans",
  gothic: "font-sans font-bold tracking-tighter",
  serif: "font-serif",
  mono: "font-mono",
};

export const RSVP_LABELS: Record<RsvpStatus, string> = {
  attending: "참석",
  undecided: "미정",
  absent: "불참",
};

type UserNameFields = { name?: string | null; nickname?: string | null };

/** 참석자 목록(/participants)과 동일한 표시 이름 우선순위 */
export function getUserDisplayName(
  user: UserNameFields | null | undefined,
  fallback = "이름 없음",
): string {
  const name = user?.name?.trim();
  if (name) return name;
  const nickname = user?.nickname?.trim();
  if (nickname) return nickname;
  return fallback;
}

/** 댓글 작성자 표시 — name만 사용 (nickname 미사용) */
export function getCommentAuthorName(
  user: UserNameFields | null | undefined,
  fallback = "이름 없음",
): string {
  const name = user?.name?.trim();
  if (name) return name;
  return fallback;
}

export function getParticipantDisplayName(
  participant: { displayName?: string | null },
  user: UserNameFields | null | undefined,
  fallback = "이름 없음",
): string {
  const displayName = participant.displayName?.trim();
  if (displayName) return displayName;
  return getUserDisplayName(user, fallback);
}
import type { RsvpStatus } from "@/lib/api/participants";

export interface InvitationDetailProps {
  invitationId: string;
  currentUserId?: string | null;
  currentUserDisplayName?: string | null;
  currentUserProfileImageUrl?: string | null;
}

export const FONT_CLASS: Record<string, string> = {
  // 레거시 (기존 초대장 호환)
  default: "font-sans",
  gothic: "font-sans font-bold tracking-tighter",
  serif: "font-serif",
  mono: "font-mono",
  // 초대장 제목 폰트 (docs/font.md + Pretendard) — globals.css 유틸리티와 1:1
  pretendard: "font-pretendard",
  "elegant-serif": "font-elegant-serif",
  jiptokki: "font-jiptokki",
  "partial-sans": "font-partial-sans",
  silla: "font-silla",
  highteen: "font-highteen",
  dos: "font-dos",
  moonhalo: "font-moonhalo",
};

export const RSVP_LABELS: Record<RsvpStatus, string> = {
  attending: "참석",
  undecided: "미정",
  absent: "불참",
};

type UserNameFields = {
  name?: string | null;
  nickname?: string | null;
  isWithdrawn?: boolean;
};

/** 탈퇴(soft-deleted) 회원 표시 라벨 */
export const WITHDRAWN_USER_NAME = "탈퇴한 회원";

/** 참석자 목록(/participants)과 동일한 표시 이름 우선순위 */
export function getUserDisplayName(
  user: UserNameFields | null | undefined,
  fallback = "이름 없음",
): string {
  if (user?.isWithdrawn) return WITHDRAWN_USER_NAME;
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
  if (user?.isWithdrawn) return WITHDRAWN_USER_NAME;
  const name = user?.name?.trim();
  if (name) return name;
  return fallback;
}

export function getParticipantDisplayName(
  user: UserNameFields | null | undefined,
  fallback = "이름 없음",
): string {
  return getUserDisplayName(user, fallback);
}
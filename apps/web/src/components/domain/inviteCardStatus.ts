import type { InvitationCardVariant } from "@/utils/resolveInvitationCardStatus";
import type { InviteCardBadge } from "./InviteCard";

/** 레거시 InvitationCard 상태 변형 → 새 InviteCard 배지(라벨·tone). 라벨 문구는 기존과 동일. */
const STATUS_BADGE: Record<InvitationCardVariant, InviteCardBadge | null> = {
  default: null,
  noImage: null,
  createdByMe: { label: "내가 만든", tone: "warning" },
  hosting: { label: "호스팅", tone: "warning" },
  invited: { label: "참여한", tone: "neutral" },
  today: { label: "오늘", tone: "danger" },
  upcoming: { label: "D-3", tone: "info" },
  ended: { label: "지난 모임", tone: "neutral" },
  draft: { label: "임시저장", tone: "neutral" },
  private: { label: "비공개", tone: "neutral" },
};

export function statusChipToBadge(
  chip: { variant: InvitationCardVariant; ddayLabel?: string } | null,
): InviteCardBadge | undefined {
  if (!chip) return undefined;
  const base = STATUS_BADGE[chip.variant];
  if (!base) return undefined;
  if (chip.variant === "upcoming" && chip.ddayLabel) {
    return { ...base, label: chip.ddayLabel };
  }
  return base;
}

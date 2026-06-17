export type InvitationCardVariant =
  | "default"
  | "createdByMe"
  | "hosting"
  | "invited"
  | "today"
  | "upcoming"
  | "ended"
  | "draft"
  | "private"
  | "noImage";

export function resolveInvitationCardStatus(params: {
  eventStartAt: string | null | undefined;
  status?: "active" | "closed";
  isHostedByMe?: boolean;
}): { variant: InvitationCardVariant; ddayLabel?: string } | null {
  if (params.isHostedByMe) {
    return { variant: "hosting" };
  }

  if (!params.eventStartAt) {
    return null;
  }

  const start = new Date(params.eventStartAt);
  if (Number.isNaN(start.getTime())) {
    return null;
  }

  const today = new Date();
  start.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.round((start.getTime() - today.getTime()) / 86_400_000);

  if (params.status === "closed" || diffDays < 0) {
    return { variant: "ended" };
  }
  if (diffDays === 0) {
    return { variant: "today" };
  }
  return {
    variant: "upcoming",
    ddayLabel: `D-${diffDays}`,
  };
}

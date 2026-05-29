import type { RsvpStatus } from "@/lib/api/participants";

export interface InvitationDetailProps {
  invitationId: string;
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
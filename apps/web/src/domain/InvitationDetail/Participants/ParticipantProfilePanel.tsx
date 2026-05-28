"use client";

import { ParticipantProfileModal } from "@/components/organisms/ParticipantProfileModal";
import type { ParticipantsResponse, RsvpStatus } from "@/lib/api/participants";
import type { ParticipantRsvp } from "@/components/organisms/ParticipantItem";

export type ParticipantRow = ParticipantsResponse["participants"][number];

const RSVP_TO_PARTICIPANT: Record<RsvpStatus, ParticipantRsvp> = {
  attending: "attending",
  undecided: "maybe",
  absent: "declined",
};

interface Props {
  row: ParticipantRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ParticipantProfilePanel({ row, open, onOpenChange }: Props) {
  if (!row) return null;
  return (
    <ParticipantProfileModal
      open={open}
      onOpenChange={onOpenChange}
      name={row.participant.displayName ?? row.user.name ?? row.user.nickname ?? "이름 없음"}
      handle={row.user.nickname ?? undefined}
      avatarUrl={row.user.profileImageUrl ?? undefined}
      status={RSVP_TO_PARTICIPANT[row.participant.rsvpStatus]}
      isHost={row.participant.memberRole === "HOST"}
      requestPreview={row.participant.note ?? undefined}
      onDm={() => {}}
    />
  );
}

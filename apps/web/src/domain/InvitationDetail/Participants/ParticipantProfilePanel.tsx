"use client";

import { ParticipantProfileModal } from "@/components/domain";
import type { ParticipantsResponse } from "@/lib/api/participants";

export type ParticipantRow = ParticipantsResponse["participants"][number];

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
      userId={row.user.id}
      name={row.user.name ?? row.user.nickname ?? "이름 없음"}
      handle={row.user.nickname ?? undefined}
      avatarUrl={row.user.profileImageUrl ?? undefined}
      status={row.participant.rsvpStatus}
      isHost={row.participant.memberRole === "HOST"}
      requestPreview={row.participant.note ?? undefined}
    />
  );
}

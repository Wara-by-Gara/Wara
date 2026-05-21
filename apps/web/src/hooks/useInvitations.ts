"use client";

import { useMutation } from "@tanstack/react-query";
import { createInvitation, type CreatedInvitation } from "@/lib/api/invitations";

interface CreateInvitationPayload {
  title: string;
  description: string;
  mainImageKey: string;
  templateId?: string;
  eventStartAt?: string;
  isMissionEnabled?: boolean;
}

export function useCreateInvitation() {
  return useMutation<CreatedInvitation, unknown, CreateInvitationPayload>({
    mutationFn: (payload) => {
      const token = localStorage.getItem("access_token") ?? "";
      return createInvitation(payload, token);
    },
  });
}

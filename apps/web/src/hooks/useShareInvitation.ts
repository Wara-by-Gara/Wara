"use client";

import { useState } from "react";
import { createSendLog } from "@/lib/api/sendLogs";

export function useShareInvitation(invitationId: string) {
  const [copied, setCopied] = useState(false);

  const getToken = () => localStorage.getItem("access_token") ?? "";

  const copyLink = async () => {
    const { inviteUrl } = await createSendLog(invitationId, { channel: "link" }, getToken());
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareViaSms = async () => {
    const { smsUri } = await createSendLog(invitationId, { channel: "sms" }, getToken());
    window.location.href = smsUri ?? `sms:?body=${encodeURIComponent(`${window.location.origin}/i/${invitationId}`)}`;
  };

  const shareViaInstagram = async () => {
    const { inviteUrl } = await createSendLog(invitationId, { channel: "instagram" }, getToken());
    await navigator.clipboard.writeText(inviteUrl);
    window.location.href = "instagram://";
  };

  return { copyLink, shareViaSms, shareViaInstagram, copied };
}

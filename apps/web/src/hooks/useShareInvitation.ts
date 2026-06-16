"use client";

import { useState } from "react";
import { createSendLog } from "@/lib/api/sendLogs";

const KAKAO_SDK_URL = "https://t1.kakaocdn.net/kakao_js_sdk/2.8.1/kakao.min.js";

function loadKakaoSdk(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.Kakao) return resolve();
    const script = document.createElement("script");
    script.src = KAKAO_SDK_URL;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Kakao SDK 로드 실패"));
    document.head.appendChild(script);
  });
}

export function useShareInvitation(invitationId: string) {
  const [copied, setCopied] = useState(false);

  const copyLink = async () => {
    const { inviteUrl } = await createSendLog(invitationId, { channel: "link" });
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareViaKakao = async () => {
    const { inviteUrl } = await createSendLog(invitationId, { channel: "kakao" });

    await loadKakaoSdk();

    if (!window.Kakao.isInitialized()) {
      window.Kakao.init(process.env.NEXT_PUBLIC_KAKAO_JS_KEY!);
    }

    window.Kakao.Share.sendScrap({ requestUrl: inviteUrl });
  };

  const shareViaSms = async () => {
    const { smsUri } = await createSendLog(invitationId, { channel: "sms" });
    window.location.href = smsUri ?? `sms:?body=${encodeURIComponent(`${window.location.origin}/invitations/${invitationId}`)}`;
  };

  const shareViaInstagram = async () => {
    const { inviteUrl } = await createSendLog(invitationId, { channel: "instagram" });
    await navigator.clipboard.writeText(inviteUrl);
    window.location.href = "instagram://";
  };

  return { copyLink, shareViaKakao, shareViaSms, shareViaInstagram, copied };
}

"use client";

import { useState } from "react";
import { createSendLog } from "@/lib/api/sendLogs";

const KAKAO_SDK_URL = "https://t1.kakaocdn.net/kakao_js_sdk/2.8.1/kakao.min.js";
const KAKAO_DEFAULT_TITLE = "WARA 초대장";
const KAKAO_DEFAULT_DESCRIPTION = "초대장이 도착했어요!";
const KAKAO_LOGO_PATH = "/wara-logo.png";
const KAKAO_BUTTON_LABEL = "초대장 보기";

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

export function useShareInvitation(invitationId: string, title?: string, description?: string, mainImageUrl?: string) {
  const [copied, setCopied] = useState(false);

  const getToken = () => localStorage.getItem("access_token") ?? "";

  const copyLink = async () => {
    const { inviteUrl } = await createSendLog(invitationId, { channel: "link" }, getToken());
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareViaKakao = async () => {
    const resolvedTitle = title ?? KAKAO_DEFAULT_TITLE;
    const resolvedDescription = description ?? KAKAO_DEFAULT_DESCRIPTION;
    const resolvedImageUrl = mainImageUrl ?? `${window.location.origin}${KAKAO_LOGO_PATH}`;

    const { inviteUrl } = await createSendLog(invitationId, { channel: "kakao" }, getToken());

    await loadKakaoSdk();

    if (!window.Kakao.isInitialized()) {
      window.Kakao.init(process.env.NEXT_PUBLIC_KAKAO_JS_KEY!);
    }

    window.Kakao.Share.sendDefault({
      objectType: "feed",
      content: {
        title: resolvedTitle,
        description: resolvedDescription,
        imageUrl: resolvedImageUrl,
        imageWidth: 800,
        imageHeight: 400,
        link: { mobileWebUrl: inviteUrl, webUrl: inviteUrl },
      },
      buttons: [
        {
          title: KAKAO_BUTTON_LABEL,
          link: { mobileWebUrl: inviteUrl, webUrl: inviteUrl },
        },
      ],
    });
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

  return { copyLink, shareViaKakao, shareViaSms, shareViaInstagram, copied };
}

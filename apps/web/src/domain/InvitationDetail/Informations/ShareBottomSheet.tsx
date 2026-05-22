"use client";

import { BottomSheet, BottomSheetContent } from "@/components/molecules/BottomSheet";
import { ShareOptionItem } from "@/components/molecules/ShareOptionItem";
import { useShareInvitation } from "@/hooks/useShareInvitation";
import { useInvitation } from "@/hooks/useInvitations";

interface Props {
  invitationId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ShareBottomSheet({ invitationId, open, onOpenChange }: Props) {
  const { data: invitation } = useInvitation(invitationId);
  const { copyLink, shareViaKakao, shareViaSms, shareViaInstagram, copied } =
    useShareInvitation(invitationId, invitation?.title, invitation?.description);

  return (
    <BottomSheet open={open} onOpenChange={onOpenChange}>
      <BottomSheetContent title="공유하기">
        <div className="flex flex-col gap-1 pb-2">
          <ShareOptionItem
            icon="link"
            title={copied ? "복사됨!" : "링크 복사"}
            iconBg="bg-gray-100"
            onClick={copyLink}
          />
          <ShareOptionItem
            icon="kakao-logo"
            title="카카오톡 공유"
            iconBg="bg-[#FEE500]"
            onClick={shareViaKakao}
          />
          <button
            type="button"
            className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            onClick={shareViaSms}
          >
            <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-2xl bg-gray-100">
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <path
                  d="M4 5h14a1 1 0 011 1v8a1 1 0 01-1 1H7l-4 3V6a1 1 0 011-1z"
                  stroke="#58423d"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <span className="text-[15px] font-semibold text-text-primary">문자</span>
          </button>
          <button
            type="button"
            className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            onClick={shareViaInstagram}
          >
            <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400">
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <rect x="4" y="4" width="14" height="14" rx="4" stroke="white" strokeWidth="1.5" />
                <circle cx="11" cy="11" r="3.5" stroke="white" strokeWidth="1.5" />
                <circle cx="15.5" cy="6.5" r="1" fill="white" />
              </svg>
            </span>
            <span className="text-[15px] font-semibold text-text-primary">인스타그램</span>
          </button>
          <ShareOptionItem
            icon="qrcode"
            title="QR 코드"
            iconBg="bg-sky-100"
            iconColor="text-sky-500"
          />
          <ShareOptionItem
            icon="download"
            title="이미지로 저장"
            iconBg="bg-pink-100"
            iconColor="text-pink-600"
          />
        </div>
      </BottomSheetContent>
    </BottomSheet>
  );
}

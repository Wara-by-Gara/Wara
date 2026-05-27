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
    useShareInvitation(invitationId, invitation?.title, invitation?.description, invitation?.mainImageUrl);

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
          <ShareOptionItem
            icon="message-circle"
            title="문자"
            iconBg="bg-gray-100"
            onClick={shareViaSms}
          />
          <ShareOptionItem
            icon="instagram-logo"
            title="인스타그램"
            iconBg="bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400"
            onClick={shareViaInstagram}
          />
        </div>
      </BottomSheetContent>
    </BottomSheet>
  );
}

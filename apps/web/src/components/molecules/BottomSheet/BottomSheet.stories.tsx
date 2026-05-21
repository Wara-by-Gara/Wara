import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Button } from "@/components/primitives/Button";
import { ShareOptionItem } from "@/components/molecules/ShareOptionItem";
import {
  BottomSheet,
  BottomSheetContent,
  BottomSheetTrigger,
} from "./BottomSheet";
import { RSVPButtonGroup, type RSVPValue } from "@/components/molecules/RSVPButtonGroup";

const meta: Meta = {
  title: "Molecules/BottomSheet",
  parameters: {
    docs: {
      description: {
        component:
          "vaul 기반 Drawer. DESIGN.md §17 (Bottom Sheet 규칙) 준수. drag-to-dismiss 자동.",
      },
    },
  },
};
export default meta;

type Story = StoryObj;

export const Share: Story = {
  render: () => (
    <BottomSheet>
      <BottomSheetTrigger asChild>
        <Button>공유 바텀시트 열기</Button>
      </BottomSheetTrigger>
      <BottomSheetContent title="공유하기" description="초대장을 친구들에게 보내보세요">
        <div className="flex flex-col gap-1">
          <ShareOptionItem icon="link" title="링크 복사" iconBg="bg-gray-100" />
          <ShareOptionItem icon="message-circle" title="카카오톡 공유" iconBg="bg-yellow-300" iconColor="text-gray-900" />
          <ShareOptionItem icon="send" title="문자 공유" iconBg="bg-sky-100" iconColor="text-sky-500" />
          <ShareOptionItem icon="qrcode" title="QR 코드" iconBg="bg-sky-100" iconColor="text-sky-500" />
          <ShareOptionItem icon="download" title="이미지로 저장" iconBg="bg-pink-100" iconColor="text-pink-600" />
        </div>
      </BottomSheetContent>
    </BottomSheet>
  ),
};

const ControlledRSVPDemo = () => {
  const [open, setOpen] = useState(false);
  const [rsvp, setRsvp] = useState<RSVPValue | undefined>(undefined);
  return (
    <>
      <Button onClick={() => setOpen(true)}>RSVP 시트 열기</Button>
      <BottomSheet open={open} onOpenChange={setOpen}>
        <BottomSheetContent title="참석 여부" description="원하는 응답을 선택해주세요">
          <div className="pt-2">
            <RSVPButtonGroup value={rsvp} onValueChange={setRsvp} />
          </div>
        </BottomSheetContent>
      </BottomSheet>
    </>
  );
};

export const ControlledRSVP: Story = { render: () => <ControlledRSVPDemo /> };

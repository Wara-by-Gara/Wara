import type { Meta, StoryObj } from "@storybook/react";
import { ShareOptionItem } from "./ShareOptionItem";

const meta: Meta<typeof ShareOptionItem> = {
  title: "Molecules/ShareOptionItem",
  component: ShareOptionItem,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: { component: "공유 바텀시트 옵션 1개. 6종 옵션을 카드 리스트 형태로." },
    },
  },
  decorators: [
    (Story) => (
      <div style={{ width: 360 }}>
        <Story />
      </div>
    ),
  ],
};
export default meta;
type Story = StoryObj<typeof ShareOptionItem>;

export const KakaoTalk: Story = {
  args: {
    icon: "message-circle",
    title: "카카오톡 공유",
    description: "친구에게 바로 보내기",
    iconBg: "bg-yellow-300",
    iconColor: "text-gray-900",
  },
};

export const LinkCopy: Story = {
  args: { icon: "link", title: "링크 복사", iconBg: "bg-gray-100" },
};

export const QrCode: Story = {
  args: { icon: "qrcode", title: "QR 코드 보기", iconBg: "bg-sky-100", iconColor: "text-sky-500" },
};

export const SaveImage: Story = {
  args: { icon: "download", title: "이미지로 저장", iconBg: "bg-pink-100", iconColor: "text-pink-600" },
};

export const AllOptions: Story = {
  render: () => (
    <div className="flex flex-col gap-1">
      <ShareOptionItem icon="link" title="링크 복사" iconBg="bg-gray-100" />
      <ShareOptionItem icon="message-circle" title="카카오톡 공유" iconBg="bg-yellow-300" iconColor="text-gray-900" />
      <ShareOptionItem icon="send" title="문자 공유" iconBg="bg-sky-100" iconColor="text-sky-500" />
      <ShareOptionItem icon="qrcode" title="QR 코드" iconBg="bg-sky-100" iconColor="text-sky-500" />
      <ShareOptionItem icon="download" title="이미지로 저장" iconBg="bg-pink-100" iconColor="text-pink-600" />
      <ShareOptionItem icon="share" title="다른 앱으로 공유" iconBg="bg-gray-100" />
    </div>
  ),
};

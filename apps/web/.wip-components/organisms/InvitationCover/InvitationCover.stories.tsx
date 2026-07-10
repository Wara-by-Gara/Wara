import type { Meta, StoryObj } from "@storybook/react";
import { InvitationCover } from "./InvitationCover";

const meta: Meta<typeof InvitationCover> = {
  title: "Organisms/InvitationCover",
  component: InvitationCover,
  tags: ["autodocs"],
  parameters: {
    docs: { description: { component: "초대장 상세의 표지. 이미지/컬러/템플릿/이미지 없음." } },
  },
  decorators: [
    (Story) => (
      <div style={{ width: 320 }}>
        <Story />
      </div>
    ),
  ],
};
export default meta;
type Story = StoryObj<typeof InvitationCover>;

const Title = () => (
  <>
    <h1 className="text-[28px] font-extrabold leading-tight">와라의 생일 파티</h1>
    <p className="mt-1 text-[14px] opacity-90">2026년 5월 19일 화요일 · 오후 7시</p>
  </>
);

export const Image: Story = {
  args: {
    variant: "image",
    imageUrl: "https://placehold.co/640x800/FFC4DF/171717?text=Wara+Party",
    ddayLabel: "D-3",
    onShare: () => {},
    children: <Title />,
  },
};

export const ColorBackground: Story = {
  args: { variant: "color", backgroundClass: "bg-cranberry-20", ddayLabel: "TODAY", children: <Title /> },
};

export const Template: Story = {
  args: {
    variant: "template",
    imageUrl: "https://placehold.co/640x800/FFE47A/171717?text=Template",
    children: <Title />,
  },
};

export const NoImage: Story = { args: { variant: "no-image", children: <Title /> } };

export const HostActions: Story = {
  args: {
    variant: "image",
    imageUrl: "https://placehold.co/640x800/8DD4FF/171717?text=Wara",
    isHost: true,
    onShare: () => {},
    onMore: () => {},
    onBack: () => {},
    children: <Title />,
  },
};

export const GuestView: Story = {
  args: {
    variant: "image",
    imageUrl: "https://placehold.co/640x800/A8F0D2/171717?text=Wara",
    onShare: () => {},
    onBack: () => {},
    children: <Title />,
  },
};

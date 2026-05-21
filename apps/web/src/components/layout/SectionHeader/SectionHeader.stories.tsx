import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "@/components/primitives/Button";
import { SectionHeader } from "./SectionHeader";

const meta: Meta<typeof SectionHeader> = {
  title: "Layout/SectionHeader",
  component: SectionHeader,
  tags: ["autodocs"],
  parameters: { docs: { description: { component: "초대장 상세/앨범/댓글 등 섹션 헤더." } } },
  decorators: [
    (Story) => (
      <div style={{ width: 360 }}>
        <Story />
      </div>
    ),
  ],
};
export default meta;
type Story = StoryObj<typeof SectionHeader>;

export const TitleOnly: Story = { args: { heading: "참석자" } };
export const TitleDescription: Story = {
  args: { heading: "앨범", description: "모임 사진을 함께 모아보세요" },
};
export const TitleAction: Story = {
  args: {
    heading: "댓글",
    action: <Button variant="text" size="sm">전체 보기</Button>,
  },
};
export const Collapsible: Story = {
  args: {
    heading: "공지",
    collapsible: true,
    children: <p className="mt-2 text-[14px] text-text-secondary">주차장은 건물 지하 1층입니다.</p>,
  },
};

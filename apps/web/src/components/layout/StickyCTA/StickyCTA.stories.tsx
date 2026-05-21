import type { Meta, StoryObj } from "@storybook/react";
import { StickyCTA } from "./StickyCTA";

const meta: Meta<typeof StickyCTA> = {
  title: "Layout/StickyCTA",
  component: StickyCTA,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: { description: { component: "DESIGN.md §3.2. 하단 고정 주요 행동." } },
  },
  decorators: [
    (Story) => (
      <div style={{ width: 390 }}>
        <Story />
      </div>
    ),
  ],
};
export default meta;
type Story = StoryObj<typeof StickyCTA>;

export const OneButton: Story = {
  args: { primary: { label: "참석할게요" } },
};
export const TwoButtons: Story = {
  args: {
    primary: { label: "만들기" },
    secondary: { label: "임시저장" },
  },
};
export const WithLeftInfo: Story = {
  args: {
    leftInfo: (
      <div className="flex flex-col">
        <span className="text-[12px] text-text-tertiary">참석</span>
        <span className="text-[16px] font-bold text-primary">12/15</span>
      </div>
    ),
    primary: { label: "공유하기" },
  },
};
export const Disabled: Story = {
  args: { primary: { label: "다음", disabled: true } },
};
export const Loading: Story = {
  args: { primary: { label: "초대장 만드는 중...", loading: true } },
};

import type { Meta, StoryObj } from "@storybook/react";
import { ParticipantItem } from "./ParticipantItem";

const meta: Meta<typeof ParticipantItem> = {
  title: "Organisms/ParticipantItem",
  component: ParticipantItem,
  tags: ["autodocs"],
  parameters: {
    docs: { description: { component: "DESIGN.md §22. 참석자 명단 1개 행." } },
  },
  decorators: [
    (Story) => (
      <div style={{ width: 360 }} className="px-4">
        <Story />
      </div>
    ),
  ],
  args: { name: "김와라", avatarUrl: "https://i.pravatar.cc/80?img=15" },
};
export default meta;
type Story = StoryObj<typeof ParticipantItem>;

export const Attending: Story = { args: { status: "attending" } };
export const Maybe: Story = { args: { status: "maybe" } };
export const Declined: Story = { args: { status: "declined" } };
export const NoResponse: Story = { args: { status: "noResponse" } };
export const Host: Story = { args: { status: "attending", isHost: true } };
export const Guest: Story = { args: { status: "attending", companionCount: 2 } };
export const WithRequest: Story = {
  args: { status: "attending", requestPreview: "참석 가능하지만 조금 늦을수도 있어요" },
};
export const WithMemo: Story = {
  args: { status: "attending", memo: "비건 / 알러지: 견과류", onMore: () => {} },
};

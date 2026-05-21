import type { Meta, StoryObj } from "@storybook/react";
import { ParticipantSummaryCard } from "./ParticipantSummaryCard";

const meta: Meta<typeof ParticipantSummaryCard> = {
  title: "Organisms/ParticipantSummaryCard",
  component: ParticipantSummaryCard,
  tags: ["autodocs"],
  parameters: { docs: { description: { component: "참석/미정/불참 요약 카드." } } },
  decorators: [
    (Story) => (
      <div style={{ width: 360 }}>
        <Story />
      </div>
    ),
  ],
};
export default meta;
type Story = StoryObj<typeof ParticipantSummaryCard>;

export const Guest: Story = {
  args: { variant: "guest", summary: { total: 15, attending: 12, maybe: 2, declined: 1 } },
};
export const Host: Story = {
  args: {
    variant: "host",
    summary: { total: 20, attending: 12, maybe: 2, declined: 1, noResponse: 5, capacity: 15 },
  },
};
export const Compact: Story = {
  args: { variant: "compact", summary: { total: 15, attending: 12, maybe: 2, declined: 1 } },
};

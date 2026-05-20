import type { Meta, StoryObj } from "@storybook/react";
import { Divider } from "./Divider";

const meta = {
  title: "Primitives/Divider",
  component: Divider,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component: "설정/리스트/섹션 구분용. role='separator'.",
      },
    },
  },
  argTypes: {
    orientation: { control: "select", options: ["horizontal", "vertical"] },
    strength: { control: "select", options: ["soft", "strong"] },
  },
} satisfies Meta<typeof Divider>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Horizontal: Story = {
  decorators: [
    (Story) => (
      <div style={{ width: 320 }}>
        <Story />
      </div>
    ),
  ],
};
export const HorizontalStrong: Story = {
  args: { strength: "strong" },
  decorators: [
    (Story) => (
      <div style={{ width: 320 }}>
        <Story />
      </div>
    ),
  ],
};
export const Vertical: Story = {
  args: { orientation: "vertical" },
  decorators: [
    (Story) => (
      <div style={{ height: 60, display: "flex" }}>
        <Story />
      </div>
    ),
  ],
};

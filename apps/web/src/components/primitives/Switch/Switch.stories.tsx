import type { Meta, StoryObj } from "@storybook/react";
import { Switch } from "./Switch";

const meta = {
  title: "Primitives/Switch",
  component: Switch,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: { component: "Radix Switch. RSVP/댓글/앨범/알림 토글 등에 사용." },
    },
  },
  argTypes: {
    checked: { control: "boolean" },
    disabled: { control: "boolean" },
    loading: { control: "boolean" },
  },
} satisfies Meta<typeof Switch>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Off: Story = {};
export const On: Story = { args: { defaultChecked: true } };
export const Disabled: Story = { args: { disabled: true } };
export const Loading: Story = { args: { loading: true, defaultChecked: true } };

export const WithLabel: Story = {
  render: () => (
    <label className="flex items-center justify-between gap-3 w-72">
      <span className="text-[15px] text-text-primary">RSVP 사용</span>
      <Switch defaultChecked />
    </label>
  ),
};

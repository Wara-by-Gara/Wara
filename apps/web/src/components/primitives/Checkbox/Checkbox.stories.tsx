import type { Meta, StoryObj } from "@storybook/react";
import { Checkbox } from "./Checkbox";

const meta = {
  title: "Primitives/Checkbox",
  component: Checkbox,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: { component: "Radix Checkbox 기반. 약관/필수 질문/복수 선택 등에 사용." },
    },
  },
  argTypes: {
    checked: { control: "boolean" },
    disabled: { control: "boolean" },
    error: { control: "boolean" },
  },
} satisfies Meta<typeof Checkbox>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Unchecked: Story = {};
export const Checked: Story = { args: { defaultChecked: true } };
export const Disabled: Story = { args: { disabled: true } };
export const ErrorState: Story = { args: { error: true } };

export const WithLabel: Story = {
  render: () => (
    <label className="flex items-center gap-2 text-[15px] text-text-primary cursor-pointer">
      <Checkbox defaultChecked id="terms" />
      <span>이용약관에 동의합니다</span>
    </label>
  ),
};

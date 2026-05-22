import type { Meta, StoryObj } from "@storybook/react";
import { Chip } from "./Chip";

const meta = {
  title: "Primitives/Chip",
  component: Chip,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component: "DESIGN.md §19 (Badge / Chip 규칙). 선택/필터/카테고리/상태/제거 가능 5종.",
      },
    },
  },
  argTypes: {
    variant: { control: "select", options: ["selectable", "filter", "category", "status", "removable"] },
    selected: { control: "boolean" },
    disabled: { control: "boolean" },
  },
  args: { children: "결혼" },
} satisfies Meta<typeof Chip>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Selectable: Story = { args: { variant: "selectable" } };
export const Selected: Story = { args: { variant: "selectable", selected: true } };
export const Filter: Story = { args: { variant: "filter", children: "참석만 보기" } };
export const Category: Story = { args: { variant: "category", children: "Y2K" } };
export const Status: Story = { args: { variant: "status", children: "초대 받음" } };
export const Removable: Story = {
  args: { variant: "removable", children: "고향 친구", onRemove: () => {} },
};

export const States: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Chip>Default</Chip>
      <Chip selected>Selected</Chip>
      <Chip disabled>Disabled</Chip>
      <Chip onRemove={() => {}}>With Close</Chip>
    </div>
  ),
};

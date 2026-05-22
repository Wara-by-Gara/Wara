import type { Meta, StoryObj } from "@storybook/react";
import { IconButton } from "@/components/primitives/IconButton";
import { SearchBar } from "./SearchBar";

const meta: Meta<typeof SearchBar> = {
  title: "Molecules/SearchBar",
  component: SearchBar,
  tags: ["autodocs"],
  parameters: {
    docs: { description: { component: "초대장 / 참석자 / 장소 검색에 사용." } },
  },
  decorators: [
    (Story) => (
      <div style={{ width: 360 }}>
        <Story />
      </div>
    ),
  ],
  args: { placeholder: "초대장 검색" },
};
export default meta;
type Story = StoryObj<typeof SearchBar>;

export const Basic: Story = {};
export const WithCancel: Story = { args: { showCancel: true } };
export const WithFilter: Story = {
  args: {
    rightSlot: <IconButton icon="filter" size="sm" aria-label="필터" variant="ghost" />,
  },
};
export const Disabled: Story = { args: { disabled: true, defaultValue: "검색 불가" } };

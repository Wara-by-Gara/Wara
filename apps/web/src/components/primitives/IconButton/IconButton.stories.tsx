import type { Meta, StoryObj } from "@storybook/react";
import { IconButton } from "./IconButton";

const meta = {
  title: "Primitives/IconButton",
  component: IconButton,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "DESIGN.md §11.2 / ICONS.md §1.2. 아이콘 전용 원형 버튼. 터치 영역 최소 44×44px (size='md').",
      },
    },
  },
  argTypes: {
    icon: { control: "text" },
    variant: { control: "select", options: ["default", "filled", "ghost", "danger"] },
    size: { control: "select", options: ["sm", "md", "lg"] },
    active: { control: "boolean" },
    badge: { control: "boolean" },
  },
  args: {
    icon: "bell",
    "aria-label": "알림 열기",
  },
} satisfies Meta<typeof IconButton>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Filled: Story = { args: { variant: "filled", icon: "plus", "aria-label": "초대장 만들기" } };
export const Ghost: Story = { args: { variant: "ghost", icon: "search", "aria-label": "검색" } };
export const Danger: Story = { args: { variant: "danger", icon: "trash", "aria-label": "삭제" } };
export const Active: Story = { args: { active: true, icon: "heart", "aria-label": "좋아요" } };
export const WithBadge: Story = { args: { badge: true, icon: "bell", "aria-label": "새 알림 있음" } };

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <IconButton icon="bell" size="sm" aria-label="알림 small" />
      <IconButton icon="bell" size="md" aria-label="알림 medium" />
      <IconButton icon="bell" size="lg" aria-label="알림 large" />
    </div>
  ),
};

export const States: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <IconButton icon="bell" aria-label="기본" />
      <IconButton icon="bell" disabled aria-label="비활성" />
      <IconButton icon="bell" active aria-label="활성" />
      <IconButton icon="bell" badge aria-label="알림 있음" />
    </div>
  ),
};

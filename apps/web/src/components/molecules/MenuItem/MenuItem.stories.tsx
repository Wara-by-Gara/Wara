import type { Meta, StoryObj } from "@storybook/react";
import { Icon } from "@/components/icons";
import { Switch } from "@/components/primitives/Switch";
import { MenuItem } from "./MenuItem";

const meta: Meta<typeof MenuItem> = {
  title: "Molecules/MenuItem",
  component: MenuItem,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: { component: "더보기 메뉴/설정 리스트/바텀시트 옵션의 1개 행." },
    },
  },
  decorators: [
    (Story) => (
      <div style={{ width: 360 }} className="rounded-2xl border border-border bg-surface">
        <Story />
      </div>
    ),
  ],
};
export default meta;
type Story = StoryObj<typeof MenuItem>;

export const Default: Story = { args: { children: "내 프로필" } };

export const WithIcon: Story = {
  args: { leftIcon: "user", children: "프로필 수정" },
};

export const Danger: Story = {
  args: { leftIcon: "trash", variant: "danger", children: "초대장 삭제" },
};

export const Disabled: Story = {
  args: { leftIcon: "lock", children: "잠긴 항목", disabled: true },
};

export const WithBadge: Story = {
  args: { leftIcon: "bell", children: "알림", badge: "NEW" },
};

export const WithChevron: Story = {
  args: {
    leftIcon: "settings",
    children: "설정",
    rightSlot: <Icon name="chevron-right" size="sm" color="inactive" decorative />,
  },
};

export const WithToggle: Story = {
  args: {
    leftIcon: "bell",
    children: "푸시 알림",
    rightSlot: <Switch defaultChecked />,
  },
};

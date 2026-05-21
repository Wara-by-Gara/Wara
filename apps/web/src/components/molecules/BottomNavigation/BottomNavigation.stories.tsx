import type { Meta, StoryObj } from "@storybook/react";
import { BottomNavigation, type BottomNavItem } from "./BottomNavigation";

const meta: Meta<typeof BottomNavigation> = {
  title: "Molecules/BottomNavigation",
  component: BottomNavigation,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: { component: "DESIGN.md §15. 높이 64+safe area, 3~5탭." },
      story: { iframeHeight: 900 },
    },
  },
  decorators: [
    (Story) => (
      <div className="flex min-h-[880px] w-[390px] flex-col bg-background">
        <div className="min-h-[520px] flex-1 shrink-0 border-b border-dashed border-border bg-background-soft" />
        <Story />
      </div>
    ),
  ],
};
export default meta;
type Story = StoryObj<typeof BottomNavigation>;

const TABS_3: BottomNavItem[] = [
  { key: "home", label: "홈", icon: "home" },
  { key: "create", label: "만들기", icon: "plus", fab: true },
  { key: "me", label: "마이페이지", icon: "user" },
];

const TABS_4: BottomNavItem[] = [
  { key: "home", label: "홈", icon: "home" },
  { key: "invitations", label: "초대장", icon: "invitation" },
  { key: "notifications", label: "알림", icon: "bell", badge: true },
  { key: "me", label: "마이페이지", icon: "user" },
];

const TABS_5: BottomNavItem[] = [
  { key: "home", label: "홈", icon: "home" },
  { key: "invitations", label: "초대장", icon: "invitation" },
  { key: "create", label: "만들기", icon: "plus", fab: true },
  { key: "notifications", label: "앨범", icon: "image", badge: true },
  { key: "me", label: "마이페이지", icon: "user" },
];

export const ThreeTabs: Story = { args: { items: TABS_3, activeKey: "home" } };
export const FourTabs: Story = { args: { items: TABS_4, activeKey: "home" } };
export const FiveTabsWithFab: Story = { args: { items: TABS_5, activeKey: "home" } };
export const WithDisabled: Story = {
  args: {
    items: TABS_4.map((t) => (t.key === "notifications" ? { ...t, disabled: true } : t)),
    activeKey: "home",
  },
};

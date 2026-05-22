import type { Meta, StoryObj } from "@storybook/react";
import { IconButton } from "@/components/primitives/IconButton";
import { TopAppBar } from "./TopAppBar";

const meta: Meta<typeof TopAppBar> = {
  title: "Molecules/TopAppBar",
  component: TopAppBar,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: { description: { component: "DESIGN.md §14. 높이 56, padding 16, 제목 18/700." } },
  },
  decorators: [
    (Story) => (
      <div style={{ width: 390 }}>
        <Story />
      </div>
    ),
  ],
};
export default meta;
type Story = StoryObj<typeof TopAppBar>;

export const TitleOnly: Story = { args: { title: "WARA", brandLogo: true } };

export const BackTitle: Story = { args: { title: "WARA", brandLogo: true, onBack: () => {} } };

export const BackTitleAction: Story = {
  args: {
    title: "WARA",
    brandLogo: true,
    onBack: () => {},
    rightSlot: (
      <>
        <IconButton icon="share" aria-label="공유" variant="ghost" />
        <IconButton icon="more-horizontal" aria-label="더보기" variant="ghost" />
      </>
    ),
  },
};

export const Transparent: Story = {
  args: { variant: "transparent", onBack: () => {}, rightSlot: <IconButton icon="share" aria-label="공유" variant="ghost" /> },
};

export const Scrolled: Story = {
  args: { variant: "scrolled", title: "WARA", brandLogo: true, onBack: () => {} },
};

export const LargeTitle: Story = { args: { title: "WARA", largeTitle: true, brandLogo: true } };

export const WithNotificationBadge: Story = {
  args: {
    title: "WARA",
    brandLogo: true,
    rightSlot: <IconButton icon="bell" aria-label="알림" variant="ghost" badge />,
  },
};

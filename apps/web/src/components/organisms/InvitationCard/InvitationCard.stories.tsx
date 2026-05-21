import type { Meta, StoryObj } from "@storybook/react";
import { InvitationCardSkeleton } from "@/components/organisms/Skeleton";
import { InvitationCard } from "./InvitationCard";

const meta: Meta<typeof InvitationCard> = {
  title: "Organisms/InvitationCard",
  component: InvitationCard,
  tags: ["autodocs"],
  parameters: {
    docs: { description: { component: "DESIGN.md §20.3. 홈 목록의 초대장 1장." } },
  },
  decorators: [
    (Story) => (
      <div style={{ width: 320 }}>
        <Story />
      </div>
    ),
  ],
  args: {
    title: "와라의 생일 파티",
    date: "5월 19일 화요일 · 오후 7시",
    location: "와라 카페",
    imageUrl: "https://placehold.co/640x360/FFC4DF/171717?text=Wara",
  },
};
export default meta;
type Story = StoryObj<typeof InvitationCard>;

export const Default: Story = {};
export const CreatedByMe: Story = { args: { variant: "createdByMe", participantsCount: 12 } };
export const Invited: Story = { args: { variant: "invited", rsvpStatus: "attending" } };
export const Today: Story = { args: { variant: "today", rsvpStatus: "attending" } };
export const Upcoming: Story = { args: { variant: "upcoming", rsvpStatus: "maybe" } };
export const Ended: Story = { args: { variant: "ended", rsvpStatus: "attending" } };
export const Draft: Story = { args: { variant: "draft" } };
export const Private: Story = { args: { variant: "private" } };
export const NoImage: Story = { args: { variant: "noImage", imageUrl: undefined } };
export const SkeletonState: Story = {
  render: () => <InvitationCardSkeleton />,
};

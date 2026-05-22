import type { Meta, StoryObj } from "@storybook/react";
import {
  AlbumGridSkeleton,
  CommentListSkeleton,
  InvitationCardSkeleton,
  InvitationDetailSkeleton,
  NotificationListSkeleton,
  ParticipantListSkeleton,
  ProfileSkeleton,
  Skeleton,
} from "./Skeleton";

const meta: Meta<typeof Skeleton> = {
  title: "Organisms/Skeleton",
  component: Skeleton,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: { component: "DESIGN.md §28. 목록·카드·상세는 spinner보다 skeleton 우선." },
    },
  },
  decorators: [
    (Story) => (
      <div style={{ width: 360 }}>
        <Story />
      </div>
    ),
  ],
};
export default meta;
type Story = StoryObj<typeof Skeleton>;

export const InvitationCard: Story = { render: () => <InvitationCardSkeleton /> };
export const InvitationDetail: Story = { render: () => <InvitationDetailSkeleton /> };
export const ParticipantList: Story = { render: () => <ParticipantListSkeleton /> };
export const CommentList: Story = { render: () => <CommentListSkeleton /> };
export const AlbumGrid: Story = { render: () => <AlbumGridSkeleton /> };
export const NotificationList: Story = { render: () => <NotificationListSkeleton /> };
export const Profile: Story = { render: () => <ProfileSkeleton /> };

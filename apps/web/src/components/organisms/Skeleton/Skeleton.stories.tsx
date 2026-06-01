import type { Meta, StoryObj } from "@storybook/react";
import {
  AlbumGridSkeleton,
  CommentListSkeleton,
  InvitationAlbumSectionSkeleton,
  InvitationCardSkeleton,
  InvitationDetailSkeleton,
  InvitationFeedSkeleton,
  NotificationListSkeleton,
  ParticipantListSkeleton,
  ParticipantSummarySkeleton,
  ProfileSkeleton,
  RemindAlbumHeaderSkeleton,
  Skeleton,
} from "./Skeleton";

const meta: Meta<typeof Skeleton> = {
  title: "Organisms/Skeleton",
  component: Skeleton,
  parameters: {
    layout: "padded",
    docs: {
      description: { component: "DESIGN.md §28. 목록·카드·상세는 spinner보다 skeleton 우선." },
    },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Skeleton>;

export const Base: Story = { args: { className: "h-8 w-48" } };
export const InvitationCard: Story = { render: () => <InvitationCardSkeleton /> };
export const InvitationDetail: Story = { render: () => <InvitationDetailSkeleton /> };
export const InvitationFeed: Story = { render: () => <InvitationFeedSkeleton /> };
export const InvitationAlbumSection: Story = { render: () => <InvitationAlbumSectionSkeleton /> };
export const ParticipantSummary: Story = { render: () => <ParticipantSummarySkeleton /> };
export const ParticipantList: Story = { render: () => <ParticipantListSkeleton /> };
export const CommentList: Story = { render: () => <CommentListSkeleton /> };
export const AlbumGrid: Story = { render: () => <AlbumGridSkeleton count={6} /> };
export const NotificationList: Story = { render: () => <NotificationListSkeleton /> };
export const RemindAlbumHeader: Story = { render: () => <RemindAlbumHeaderSkeleton /> };
export const Profile: Story = { render: () => <ProfileSkeleton /> };

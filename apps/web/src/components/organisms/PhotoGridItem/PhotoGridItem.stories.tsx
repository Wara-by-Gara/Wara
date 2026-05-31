import type { Meta, StoryObj } from "@storybook/react";
import { PhotoGridItem } from "./PhotoGridItem";

const meta: Meta<typeof PhotoGridItem> = {
  title: "Organisms/PhotoGridItem",
  component: PhotoGridItem,
  tags: ["autodocs"],
  parameters: { docs: { description: { component: "앨범 그리드의 사진 1장." } } },
  decorators: [
    (Story) => (
      <div style={{ width: 120 }}>
        <Story />
      </div>
    ),
  ],
  args: {
    alt: "모임 사진",
  },
};
export default meta;
type Story = StoryObj<typeof PhotoGridItem>;

export const Default: Story = {};
export const Uploading: Story = { args: { status: "uploading", progress: 65 } };
export const Failed: Story = { args: { status: "failed" } };
export const Selected: Story = { args: { status: "selected" } };
export const Video: Story = { args: { status: "video" } };
export const Owner: Story = { args: { isOwner: true } };
export const HostManageUnselected: Story = { args: { hostManageMode: true } };
export const HostManageSelected: Story = { args: { hostManageMode: true, status: "selected" } };
export const WithLikeCount: Story = { args: { likeCount: 12 } };
export const WithLikeCountLiked: Story = { args: { likeCount: 12, liked: true } };

import type { Meta, StoryObj } from "@storybook/react";
import { RemindAlbum } from "./RemindAlbum";
import { pageStoryParameters } from "../../../.storybook/pageStoryParameters";

const meta: Meta<typeof RemindAlbum> = {
  title: "Pages/22 RemindAlbum/Page",
  component: RemindAlbum,
  parameters: pageStoryParameters,
  args: {
    onBack: () => {},
    eventTitle: "와라의 생일 파티",
    eventDate: "2026년 5월 19일 화요일",
    hostName: "김와라",
    hostAvatarUrl: "https://i.pravatar.cc/80?img=18",
  },
};
export default meta;
type Story = StoryObj<typeof RemindAlbum>;

export const Grid: Story = { args: { state: "default" } };
export const DateGrouped: Story = { args: { state: "dateGrouped" } };
export const ViewerOpen: Story = { args: { state: "viewerOpen" } };
export const LoadingSkeleton: Story = { args: { state: "loadingSkeleton" } };
export const Empty: Story = { args: { state: "empty" } };
export const ErrorState: Story = { args: { state: "error" } };

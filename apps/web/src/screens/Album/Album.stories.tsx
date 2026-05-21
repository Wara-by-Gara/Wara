import type { Meta, StoryObj } from "@storybook/react";
import { Album } from "./Album";

const meta: Meta<typeof Album> = {
  title: "Pages/14 Album/Page",
  component: Album,
  parameters: {
    layout: "fullscreen",
    viewport: { defaultViewport: "mobile" },
    docs: {
      story: { inline: false, iframeHeight: 880 },
    },
  },
  args: { onBack: () => {} },
};
export default meta;
type Story = StoryObj<typeof Album>;

export const Grid: Story = { args: { state: "grid" } };
export const DateGrouped: Story = { args: { state: "dateGrouped" } };
export const EmptyBeforeEvent: Story = { args: { state: "emptyBeforeEvent" } };
export const EmptyAfterEvent: Story = { args: { state: "emptyAfterEvent" } };
export const LoadingSkeleton: Story = { args: { state: "loadingSkeleton" } };
export const ErrorState: Story = { args: { state: "error" } };
export const PermissionRequired: Story = { args: { state: "permissionRequired" } };
export const LoginRequired: Story = { args: { state: "loginRequired" } };
export const HostManageMode: Story = { args: { state: "hostManageMode" } };
export const UploadSourceSheet: Story = { args: { state: "uploadSourceSheet" } };
export const UploadMultiSelect: Story = { args: { state: "uploadMultiSelect" } };
export const UploadPreview: Story = { args: { state: "uploadPreview" } };
export const UploadProgress: Story = { args: { state: "uploadProgress" } };
export const UploadPartialFailed: Story = { args: { state: "uploadPartialFailed" } };
export const UploadFailed: Story = { args: { state: "uploadFailed" } };
export const UploadComplete: Story = { args: { state: "uploadComplete" } };
export const SortBottomSheet: Story = { args: { state: "sortBottomSheet" } };
export const ViewerOwnerMenu: Story = { args: { state: "viewerOwnerMenu" } };
export const ViewerComments: Story = { args: { state: "viewerComments" } };
export const ViewerDelete: Story = { args: { state: "viewerDelete" } };
export const ViewerReport: Story = { args: { state: "viewerReport" } };

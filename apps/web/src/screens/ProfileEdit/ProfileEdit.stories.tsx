import type { Meta, StoryObj } from "@storybook/react";
import { ProfileEdit } from "./ProfileEdit";

const meta: Meta<typeof ProfileEdit> = {
  title: "Pages/18 Profile Edit/Page",
  component: ProfileEdit,
  parameters: { layout: "fullscreen", viewport: { defaultViewport: "mobile" } },
  args: { avatarUrl: "https://i.pravatar.cc/120?img=18" },
};
export default meta;
type Story = StoryObj<typeof ProfileEdit>;

export const Default: Story = {};
export const NicknameFocus: Story = { args: { state: "nicknameFocus" } };
export const NicknameDuplicateError: Story = { args: { state: "nicknameDuplicateError" } };
export const ImageChange: Story = { args: { state: "imageChange" } };
export const ImageCrop: Story = { args: { state: "imageCrop" } };
export const ImageDeleteModal: Story = { args: { state: "imageDeleteModal" } };
export const SaveLoading: Story = { args: { state: "saveLoading" } };
export const SaveComplete: Story = { args: { state: "saveComplete" } };
export const SaveFailed: Story = { args: { state: "saveFailed" } };

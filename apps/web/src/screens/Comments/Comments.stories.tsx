import type { Meta, StoryObj } from "@storybook/react";
import { Comments } from "./Comments";
import { pageStoryParameters } from "../../../.storybook/pageStoryParameters";

const meta: Meta<typeof Comments> = {
  title: "Pages/15 Comments/Page",
  component: Comments,
  parameters: pageStoryParameters,
  args: { onBack: () => {} },
};
export default meta;
type Story = StoryObj<typeof Comments>;

export const List: Story = { args: { state: "list" } };
export const Empty: Story = { args: { state: "empty" } };
export const Loading: Story = { args: { state: "loading" } };
export const ErrorState: Story = { args: { state: "error" } };
export const MoreLoading: Story = { args: { state: "moreLoading" } };
export const KeyboardOpen: Story = { args: { state: "keyboardOpen" } };
export const LoginRequired: Story = { args: { state: "loginRequired" } };
export const DisabledByHost: Story = { args: { state: "disabledByHost" } };
export const DeleteModal: Story = { args: { state: "deleteModal" } };
export const ReportModal: Story = { args: { state: "reportModal" } };

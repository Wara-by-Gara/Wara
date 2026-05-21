import type { Meta, StoryObj } from "@storybook/react";
import { InvitationList } from "./InvitationList";

const meta: Meta<typeof InvitationList> = {
  title: "Pages/06 Invitation List/Page",
  component: InvitationList,
  parameters: { layout: "fullscreen", viewport: { defaultViewport: "mobile" } },
};
export default meta;
type Story = StoryObj<typeof InvitationList>;

export const All: Story = { args: { tab: "all" } };
export const CreatedByMe: Story = { args: { tab: "createdByMe" } };
export const Invited: Story = { args: { tab: "invited" } };
export const Joined: Story = { args: { tab: "joined" } };
export const Draft: Story = { args: { tab: "draft" } };
export const Ended: Story = { args: { tab: "ended" } };
export const Empty: Story = { args: { state: "empty" } };
export const Loading: Story = { args: { state: "loading" } };
export const ErrorState: Story = { args: { state: "error" } };
export const Search: Story = { args: { state: "search" } };
export const SearchResult: Story = { args: { state: "searchResult" } };
export const SearchEmpty: Story = { args: { state: "searchEmpty" } };
export const FilterApplied: Story = { args: { state: "filterApplied" } };
export const CardMoreMenu: Story = { args: { state: "cardMoreMenu" } };
export const DeleteConfirm: Story = { args: { state: "deleteConfirm" } };
export const LeaveConfirm: Story = { args: { state: "leaveConfirm" } };
export const DuplicateConfirm: Story = { args: { state: "duplicateConfirm" } };

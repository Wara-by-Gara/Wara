import type { Meta, StoryObj } from "@storybook/react";
import { Participants } from "./Participants";

const meta: Meta<typeof Participants> = {
  title: "Pages/12 Participants/Page",
  component: Participants,
  parameters: { layout: "fullscreen", viewport: { defaultViewport: "mobile" } },
};
export default meta;
type Story = StoryObj<typeof Participants>;

export const SummaryAll: Story = { args: { tab: "all" } };
export const AttendingTab: Story = { args: { tab: "attending" } };
export const MaybeTab: Story = { args: { tab: "maybe" } };
export const DeclinedTab: Story = { args: { tab: "declined" } };
export const NoResponseTab: Story = { args: { tab: "noResponse" } };
export const Empty: Story = { args: { state: "empty" } };
export const Loading: Story = { args: { state: "loading" } };
export const ErrorState: Story = { args: { state: "error" } };
export const Search: Story = { args: { state: "search" } };
export const SearchResult: Story = { args: { state: "searchResult" } };
export const SearchEmpty: Story = { args: { state: "searchEmpty" } };
export const FilterBottomSheet: Story = { args: { state: "filterBottomSheet" } };
export const SortBottomSheet: Story = { args: { state: "sortBottomSheet" } };
export const DetailBottomSheet: Story = { args: { state: "detailBottomSheet", isHost: true } };
export const HostMemoEdit: Story = { args: { state: "hostMemoEdit", isHost: true } };
export const RsvpStatusChange: Story = { args: { state: "rsvpStatusChange", isHost: true } };
export const RemoveModal: Story = { args: { state: "removeModal", isHost: true } };
export const GuestLimitedView: Story = { args: { state: "guestLimited" } };
export const AttendeeView: Story = { args: { state: "attendeeView" } };
export const HostManageView: Story = { args: { state: "hostManageView", isHost: true } };
export const LoginRequired: Story = { args: { state: "loginRequired" } };

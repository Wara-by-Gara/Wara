import type { Meta, StoryObj } from "@storybook/react";
import { mockInvitation } from "@/lib/mockData";
import { Home } from "./Home";
import { pageStoryParameters } from "../../../.storybook/pageStoryParameters";

const meta: Meta<typeof Home> = {
  title: "Pages/05 Home/Page",
  component: Home,
  parameters: pageStoryParameters,
};
export default meta;
type Story = StoryObj<typeof Home>;

const sample = [
  { ...mockInvitation, variant: "upcoming" as const },
  { ...mockInvitation, id: "inv2", title: "주말 브런치", date: "5월 25일 일요일 · 오전 11시", coverImageUrl: "https://placehold.co/640x360/FFE47A/171717?text=Brunch", variant: "upcoming" as const },
];

export const GuestLanding: Story = { args: { state: "guestLanding" } };
export const LoggedInEmpty: Story = { args: { state: "loggedInEmpty" } };
export const LoggedInFilled: Story = { args: { state: "loggedInFilled", invitations: sample } };
export const TodayHighlight: Story = { args: { state: "todayHighlight", invitations: [{ ...mockInvitation, variant: "today" }] } };
export const Upcoming: Story = { args: { state: "upcoming", invitations: sample } };
export const Draft: Story = { args: { state: "draft", invitations: [{ ...mockInvitation, variant: "draft" }] } };
export const LoadingSkeleton: Story = { args: { state: "loadingSkeleton" } };
export const NetworkError: Story = { args: { state: "networkError" } };
export const PullToRefresh: Story = { args: { state: "pullToRefresh", invitations: sample } };
export const FabMenuOpened: Story = { args: { state: "fabMenuOpened", invitations: sample } };
export const SearchActivated: Story = { args: { state: "searchActivated" } };
export const SearchResults: Story = { args: { state: "searchResults", invitations: sample } };
export const SearchEmpty: Story = { args: { state: "searchEmpty" } };
export const FilterSheet: Story = { args: { state: "filterSheet", invitations: sample } };

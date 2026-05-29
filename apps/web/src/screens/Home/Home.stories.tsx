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
  {
    ...mockInvitation,
    id: "inv2",
    title: "주말 브런치",
    date: "5월 25일 일요일 · 오전 11시",
    coverImageUrl: "https://placehold.co/640x360/FFE47A/171717?text=Brunch",
    variant: "upcoming" as const,
  },
];

export const GuestLanding: Story = { args: { state: "guestLanding" } };
export const LoggedInEmpty: Story = { args: { state: "loggedInEmpty" } };
export const LoggedInFilled: Story = { args: { state: "loggedInFilled", invitations: sample } };
export const LoadingSkeleton: Story = { args: { state: "loadingSkeleton" } };
export const NetworkError: Story = { args: { state: "networkError" } };
export const TabCreatedByMe: Story = { args: { state: "loggedInFilled", tab: "createdByMe", invitations: sample } };
export const TabEnded: Story = { args: { state: "loggedInFilled", tab: "ended", invitations: sample } };

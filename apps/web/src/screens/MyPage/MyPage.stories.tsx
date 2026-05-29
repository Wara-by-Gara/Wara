import type { Meta, StoryObj } from "@storybook/react";
import { mockInvitation } from "@/lib/mockData";
import { MyPage } from "./MyPage";
import { pageStoryParameters } from "../../../.storybook/pageStoryParameters";

const meta: Meta<typeof MyPage> = {
  title: "Pages/17 My Page/Page",
  component: MyPage,
  parameters: pageStoryParameters,
};
export default meta;
type Story = StoryObj<typeof MyPage>;

const sample = [
  { id: "i1", title: mockInvitation.title, date: "5월 31일 (일) 오후 08:00", imageUrl: mockInvitation.coverImageUrl, variant: "createdByMe" as const },
  { id: "i2", title: "주말 브런치", date: "5월 25일 (일) 오후 02:00", imageUrl: "https://placehold.co/640x360/FFE47A/171717?text=Brunch", variant: "invited" as const },
];

export const Default: Story = { args: { state: "default", recentInvitations: sample } };
export const LoggedOut: Story = { args: { state: "loggedOut" } };
export const NoProfile: Story = { args: { state: "noProfile", recentInvitations: sample } };
export const NoInvitations: Story = { args: { state: "default", recentInvitations: [] } };
export const Loading: Story = { args: { state: "loading" } };
export const ErrorState: Story = { args: { state: "error" } };

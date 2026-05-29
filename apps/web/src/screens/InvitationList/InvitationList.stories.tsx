import type { Meta, StoryObj } from "@storybook/react";
import { InvitationList } from "./InvitationList";
import { pageStoryParameters } from "../../../.storybook/pageStoryParameters";

const meta: Meta<typeof InvitationList> = {
  title: "Pages/06 Invitation List/Page",
  component: InvitationList,
  parameters: pageStoryParameters,
};
export default meta;
type Story = StoryObj<typeof InvitationList>;

export const All: Story = { args: { tab: "all" } };
export const CreatedByMe: Story = { args: { tab: "createdByMe" } };
export const Joined: Story = { args: { tab: "joined" } };
export const Ended: Story = { args: { tab: "ended" } };
export const Empty: Story = { args: { state: "empty" } };
export const Loading: Story = { args: { state: "loading" } };
export const ErrorState: Story = { args: { state: "error" } };

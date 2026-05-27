import type { Meta, StoryObj } from "@storybook/react";
import { Comments } from "./Comments";
import { pageStoryParameters } from "../../../.storybook/pageStoryParameters";

const meta: Meta<typeof Comments> = {
  title: "Pages/15 Comments/Page",
  component: Comments,
  parameters: pageStoryParameters,
  args: { invitationId: "01JXXXXXXXXXXXXXXXXXXXXXXXXX" },
};
export default meta;
type Story = StoryObj<typeof Comments>;

export const Default: Story = {};

import type { Meta, StoryObj } from "@storybook/react";
import { Splash } from "./Splash";
import { pageStoryParameters } from "../../../.storybook/pageStoryParameters";

const meta: Meta<typeof Splash> = {
  title: "Pages/01 Splash/Page",
  component: Splash,
  parameters: pageStoryParameters,
};
export default meta;
type Story = StoryObj<typeof Splash>;

export const Default: Story = {};
export const DefaultNew: Story = {
  args: { state: "default_new" },
  parameters: { mobileFrameImmersive: true },
};
export const DefaultNew2: Story = {
  name: "Default New 2",
  args: { state: "default_new_2" },
  parameters: { mobileFrameImmersive: true },
};
export const Loading: Story = { args: { state: "loading" } };
export const NetworkError: Story = { args: { state: "networkError" } };
export const ServerMaintenance: Story = { args: { state: "serverMaintenance" } };
// export const UpdateRequired: Story = { args: { state: "updateRequired" } };
export const ForceUpdate: Story = { args: { state: "forceUpdate" } };
export const OptionalUpdate: Story = { args: { state: "optionalUpdate" } };
export const AutoLoginLoading: Story = { args: { state: "autoLoginLoading" } };
export const AutoLoginFailed: Story = { args: { state: "autoLoginFailed" } };

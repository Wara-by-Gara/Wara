import type { Meta, StoryObj } from "@storybook/react";
import { AccountSettings } from "./AccountSettings";

const meta: Meta<typeof AccountSettings> = {
  title: "Pages/19 Account/Page",
  component: AccountSettings,
  parameters: { layout: "fullscreen", viewport: { defaultViewport: "mobile" } },
};
export default meta;
type Story = StoryObj<typeof AccountSettings>;

export const ConnectedSocial: Story = { args: { screen: "connectedSocial" } };
export const ConnectAdditional: Story = { args: { screen: "connectAdditional" } };
export const DisconnectModal: Story = { args: { screen: "disconnectModal" } };
export const LogoutModal: Story = { args: { screen: "logoutModal" } };
export const LogoutComplete: Story = { args: { screen: "logoutComplete" } };
export const WithdrawGuide: Story = { args: { screen: "withdrawGuide" } };
export const WithdrawReason: Story = { args: { screen: "withdrawReason" } };
export const WithdrawFinalConfirm: Story = { args: { screen: "withdrawFinalConfirm" } };
export const WithdrawComplete: Story = { args: { screen: "withdrawComplete" } };

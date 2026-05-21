import type { Meta, StoryObj } from "@storybook/react";
import { Settings } from "./Settings";
import { pageStoryParameters } from "../../../.storybook/pageStoryParameters";

const meta: Meta<typeof Settings> = {
  title: "Pages/20 Settings/Page",
  component: Settings,
  parameters: pageStoryParameters,
};
export default meta;
type Story = StoryObj<typeof Settings>;

export const Main: Story = { args: { screen: "main" } };
export const Notification: Story = { args: { screen: "notification" } };
export const PushToggle: Story = { args: { screen: "pushToggle" } };
export const MarketingToggle: Story = { args: { screen: "marketingToggle" } };
export const PhotoPermission: Story = { args: { screen: "photoPermission" } };
export const LocationPermission: Story = { args: { screen: "locationPermission" } };
export const CameraPermission: Story = { args: { screen: "cameraPermission" } };
export const Theme: Story = { args: { screen: "theme" } };
export const Language: Story = { args: { screen: "language" } };
export const Terms: Story = { args: { screen: "terms" } };
export const Privacy: Story = { args: { screen: "privacy" } };
export const OpenSourceLicense: Story = { args: { screen: "openSourceLicense" } };
export const AppVersion: Story = { args: { screen: "appVersion" } };
export const CustomerSupport: Story = { args: { screen: "customerSupport" } };
export const InquiryForm: Story = { args: { screen: "inquiryForm" } };
export const InquiryComplete: Story = { args: { screen: "inquiryComplete" } };

import type { Meta, StoryObj } from "@storybook/react";
import { Onboarding } from "./Onboarding";
import { pageStoryParameters } from "../../../.storybook/pageStoryParameters";

const meta: Meta<typeof Onboarding> = {
  title: "Pages/02 Onboarding/Page",
  component: Onboarding,
  parameters: pageStoryParameters,
};
export default meta;
type Story = StoryObj<typeof Onboarding>;

export const Intro1Wara: Story = { args: { step: "intro1" } };
export const Intro2Invitation: Story = { args: { step: "intro2" } };
export const Intro3Rsvp: Story = { args: { step: "intro3" } };
export const Intro4Album: Story = { args: { step: "intro4" } };
export const Intro5Start: Story = { args: { step: "intro5" } };
export const SkipConfirmModal: Story = { args: { step: "skipModal" } };
export const NotificationPermissionGuide: Story = { args: { step: "permissionNotification" } };
export const PhotoPermissionGuide: Story = { args: { step: "permissionPhoto" } };
export const LocationPermissionGuide: Story = { args: { step: "permissionLocation" } };
export const PermissionDeniedGuide: Story = { args: { step: "permissionDenied" } };
export const CompletedRedirectLoading: Story = { args: { step: "completedRedirect" } };

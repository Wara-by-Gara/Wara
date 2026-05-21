import type { Meta, StoryObj } from "@storybook/react";
import { InvitationEdit } from "./InvitationEdit";
import { pageStoryParameters } from "../../../.storybook/pageStoryParameters";

const meta: Meta<typeof InvitationEdit> = {
  title: "Pages/10 Invitation Edit/Page",
  component: InvitationEdit,
  parameters: pageStoryParameters,
};
export default meta;
type Story = StoryObj<typeof InvitationEdit>;

export const BasicInfo: Story = { args: { step: "basicInfo" } };
export const CoverImage: Story = { args: { step: "coverImage" } };
export const DateTime: Story = { args: { step: "dateTime" } };
export const Location: Story = { args: { step: "location" } };
export const RsvpSettings: Story = { args: { step: "rsvpSettings" } };
export const PrivacySettings: Story = { args: { step: "privacySettings" } };
export const Design: Story = { args: { step: "design" } };
export const Questions: Story = { args: { step: "questions" } };
export const Preview: Story = { args: { step: "preview" } };
export const UnsavedChangesModal: Story = { args: { step: "unsavedChangesModal" } };
export const SaveLoading: Story = { args: { step: "saveLoading" } };
export const SaveComplete: Story = { args: { step: "saveComplete" } };
export const SaveFailed: Story = { args: { step: "saveFailed" } };
export const DateChangeWarningModal: Story = { args: { step: "dateChangeWarningModal" } };
export const LocationChangeNotifyModal: Story = { args: { step: "locationChangeNotifyModal" } };
export const ClosedInvitationEditLimited: Story = { args: { step: "closedInvitationEditLimited" } };

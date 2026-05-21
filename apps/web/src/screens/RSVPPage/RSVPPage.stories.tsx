import type { Meta, StoryObj } from "@storybook/react";
import { RSVPPage } from "./RSVPPage";

const meta: Meta<typeof RSVPPage> = {
  title: "Pages/11 RSVP/Page",
  component: RSVPPage,
  parameters: { layout: "fullscreen", viewport: { defaultViewport: "mobile" } },
};
export default meta;
type Story = StoryObj<typeof RSVPPage>;

export const Entry: Story = { args: { state: "entry" } };
export const InvitationSummary: Story = { args: { state: "invitationSummary" } };
export const SelectStatus: Story = { args: { state: "selectStatus" } };
export const AttendingSelected: Story = { args: { state: "attendingSelected" } };
export const MaybeSelected: Story = { args: { state: "maybeSelected" } };
export const DeclineSelected: Story = { args: { state: "declineSelected" } };
export const NameInput: Story = { args: { state: "nameInput" } };
export const CompanionCount: Story = { args: { state: "companionCount" } };
export const RequestMessage: Story = { args: { state: "requestMessage" } };
export const AdditionalQuestions: Story = { args: { state: "additionalQuestions" } };
export const RequiredQuestionError: Story = { args: { state: "requiredQuestionError" } };
export const Confirm: Story = { args: { state: "confirm" } };
export const SubmitLoading: Story = { args: { state: "submitLoading" } };
export const Complete: Story = { args: { state: "complete" } };
export const Edit: Story = { args: { state: "edit" } };
export const EditComplete: Story = { args: { state: "editComplete" } };
export const CancelConfirmModal: Story = { args: { state: "cancelConfirmModal" } };
export const Closed: Story = { args: { state: "closed" } };
export const FullCapacity: Story = { args: { state: "fullCapacity" } };
export const LoginRequired: Story = { args: { state: "loginRequired" } };
export const NetworkError: Story = { args: { state: "networkError" } };
export const AlreadySubmitted: Story = { args: { state: "alreadySubmitted" } };

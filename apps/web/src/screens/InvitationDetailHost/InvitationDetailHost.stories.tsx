import type { Meta, StoryObj } from "@storybook/react";
import { InvitationDetailHost } from "./InvitationDetailHost";

const meta: Meta<typeof InvitationDetailHost> = {
  title: "Pages/09 Invitation Detail - Host/Page",
  component: InvitationDetailHost,
  parameters: { layout: "fullscreen", viewport: { defaultViewport: "mobile" } },
  args: { onBack: () => {} },
};
export default meta;
type Story = StoryObj<typeof InvitationDetailHost>;

export const Default: Story = { args: { state: "default" } };
export const WithManagementSummary: Story = { args: { state: "withManagementSummary" } };
export const NoParticipants: Story = { args: { state: "noParticipants" } };
export const MoreMenuOpen: Story = { args: { state: "moreMenuOpen" } };
export const ShareSheetOpen: Story = { args: { state: "shareSheetOpen" } };
export const QrView: Story = { args: { state: "qrView" } };
export const LinkManagement: Story = { args: { state: "linkManagement" } };
export const LinkRegenerateModal: Story = { args: { state: "linkRegenerateModal" } };
export const CloseInvitationModal: Story = { args: { state: "closeInvitationModal" } };
export const ReopenInvitationModal: Story = { args: { state: "reopenInvitationModal" } };
export const DeleteInvitationModal: Story = { args: { state: "deleteInvitationModal" } };
export const DuplicateInvitationModal: Story = { args: { state: "duplicateInvitationModal" } };
export const MakePrivateModal: Story = { args: { state: "makePrivateModal" } };
export const SendNoticeEntry: Story = { args: { state: "sendNoticeEntry" } };
export const StatsSummary: Story = { args: { state: "statsSummary" } };
export const RsvpResponseRate: Story = { args: { state: "rsvpResponseRate" } };
export const UnrespondedParticipants: Story = { args: { state: "unrespondedParticipants" } };

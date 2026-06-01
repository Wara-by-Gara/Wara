import type { Meta, StoryObj } from "@storybook/react";
import { InvitationDetailGuest } from "./InvitationDetailGuest";
import { pageStoryParameters } from "../../../.storybook/pageStoryParameters";

const meta: Meta<typeof InvitationDetailGuest> = {
  title: "Pages/08 Invitation Detail - Guest/Page",
  component: InvitationDetailGuest,
  parameters: pageStoryParameters,
};
export default meta;
type Story = StoryObj<typeof InvitationDetailGuest>;

// Access
export const Public: Story = { args: { state: "public" } };
export const PublicMomentLog: Story = {
  args: { state: "publicMomentLog", onMomentLog: () => alert("모먼트로그로 이동") },
};
export const LoggedOut: Story = { args: { state: "loggedOut" } };
export const LoggedIn: Story = { args: { state: "loggedIn" } };
export const PasswordRequired: Story = { args: { state: "passwordRequired" } };
export const PasswordError: Story = { args: { state: "passwordError" } };
export const Expired: Story = { args: { state: "expired" } };
export const Deleted: Story = { args: { state: "deleted" } };
export const PrivateView: Story = { args: { state: "private" } };
export const PermissionDenied: Story = { args: { state: "permissionDenied" } };
export const Loading: Story = { args: { state: "loading" } };
export const ErrorState: Story = { args: { state: "error" } };

// Content
export const WithCoverImage: Story = { args: { state: "withCoverImage" } };
export const WithoutCoverImage: Story = { args: { state: "withoutCoverImage" } };
export const LongDescriptionCollapsed: Story = { args: { state: "longDescriptionCollapsed" } };
export const LongDescriptionExpanded: Story = { args: { state: "longDescriptionExpanded" } };
export const WithMapPreview: Story = { args: { state: "withMapPreview" } };
export const LocationUnknown: Story = { args: { state: "locationUnknown" } };
export const OnlineMeeting: Story = { args: { state: "onlineMeeting" } };
export const ParticipantPreview: Story = { args: { state: "participantPreview" } };
export const AlbumPreviewEmpty: Story = { args: { state: "albumPreviewEmpty" } };
export const AlbumPreviewFilled: Story = { args: { state: "albumPreviewFilled" } };
export const CommentPreviewEmpty: Story = { args: { state: "commentPreviewEmpty" } };
export const CommentPreviewFilled: Story = { args: { state: "commentPreviewFilled" } };

// Album Like Count
export const AlbumWithLikeCount: Story = {
  args: { state: "albumWithLikeCount" },
  parameters: {
    docs: { description: { story: "앨범 사진 그리드에 좋아요 카운트(♥N) 오버레이 표시" } },
  },
};

// Date Vote
export const DateVotePending: Story = { args: { state: "dateVotePending" } };

// RSVP
export const BeforeRsvp: Story = { args: { state: "beforeRsvp" } };
export const RsvpBottomSheetOpen: Story = { args: { state: "rsvpBottomSheetOpen" } };
export const AlreadyResponded: Story = { args: { state: "alreadyResponded" } };
export const AlreadyRespondedProfileOpen: Story = { args: { state: "alreadyRespondedProfileOpen" } };
export const EditRsvp: Story = { args: { state: "editRsvp" } };
export const CancelRsvpModal: Story = { args: { state: "cancelRsvpModal" } };
export const ClosedRsvp: Story = { args: { state: "closedRsvp" } };
export const FullCapacity: Story = { args: { state: "fullCapacity" } };
export const LoginRequiredForRsvp: Story = { args: { state: "loginRequiredForRsvp" } };

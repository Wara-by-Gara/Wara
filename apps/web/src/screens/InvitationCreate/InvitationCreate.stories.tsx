import type { Meta, StoryObj } from "@storybook/react";
import { InvitationCreate } from "./InvitationCreate";
import { pageStoryParameters } from "../../../.storybook/pageStoryParameters";

const meta: Meta<typeof InvitationCreate> = {
  title: "Pages/07 Invitation Create/Page",
  component: InvitationCreate,
  parameters: pageStoryParameters,
};
export default meta;
type Story = StoryObj<typeof InvitationCreate>;

// Start
export const Start: Story = { args: { step: "start" } };

// Template
export const TemplateCategory: Story = { args: { step: "templateCategory" } };
export const TemplateList: Story = { args: { step: "templateList" } };
export const TemplatePreview: Story = { args: { step: "templatePreview" } };
export const TemplateSelected: Story = { args: { step: "templateSelected" } };
export const BlankTemplate: Story = { args: { step: "blankTemplate" } };

// Basic info
export const BasicInfoEmpty: Story = { args: { step: "basicInfoEmpty" } };
export const BasicInfoFilled: Story = { args: { step: "basicInfoFilled" } };
export const BasicInfoError: Story = { args: { step: "basicInfoError" } };
export const TitleFocused: Story = { args: { step: "titleFocused" } };
export const DescriptionFocused: Story = { args: { step: "descriptionFocused" } };
export const CoverImageEmpty: Story = { args: { step: "coverImageEmpty" } };
export const CoverImageSelected: Story = { args: { step: "coverImageSelected" } };
export const CoverImageCrop: Story = { args: { step: "coverImageCrop" } };
export const CoverImageUploading: Story = { args: { step: "coverImageUploading" } };
export const CoverImageUploadFailed: Story = { args: { step: "coverImageUploadFailed" } };
export const CoverImageDeleteModal: Story = { args: { step: "coverImageDeleteModal" } };

// Date / Time
export const DateTimeEmpty: Story = { args: { step: "dateTimeEmpty" } };
export const DatePickerOpen: Story = { args: { step: "datePickerOpen" } };
export const TimePickerOpen: Story = { args: { step: "timePickerOpen" } };
export const DateTimeSelected: Story = { args: { step: "dateTimeSelected" } };
export const DateUnknownToggleOn: Story = { args: { step: "dateUnknownToggleOn" } };
export const TimeUnknownToggleOn: Story = { args: { step: "timeUnknownToggleOn" } };
export const DateVotePropose: Story = {
  args: { step: "dateVotePropose" },
  parameters: {
    ...pageStoryParameters,
    docs: { description: { story: "날짜 미정(미정 토글 ON) 상태에서 날짜 투표 기능을 제안하는 배너 UI" } },
  },
};
export const RsvpDeadlineSelect: Story = { args: { step: "rsvpDeadlineSelect" } };
export const PastDateError: Story = { args: { step: "pastDateError" } };
export const DateRequiredError: Story = { args: { step: "dateRequiredError" } };

// Location
export const LocationEmpty: Story = { args: { step: "locationEmpty" } };
export const LocationSearch: Story = { args: { step: "locationSearch" } };
export const LocationSearchResults: Story = { args: { step: "locationSearchResults" } };
export const LocationSearchEmpty: Story = { args: { step: "locationSearchEmpty" } };
export const LocationSelected: Story = { args: { step: "locationSelected" } };
export const LocationManualInput: Story = { args: { step: "locationManualInput" } };
export const OnlineMeetingLink: Story = { args: { step: "onlineMeetingLink" } };
export const LocationUnknownToggleOn: Story = { args: { step: "locationUnknownToggleOn" } };
export const MapPreview: Story = { args: { step: "mapPreview" } };
export const LocationPermissionGuide: Story = { args: { step: "locationPermissionGuide" } };

// RSVP settings
export const RsvpSettingDefault: Story = { args: { step: "rsvpSettingDefault" } };
export const RsvpToggleOff: Story = { args: { step: "rsvpToggleOff" } };
export const RsvpToggleOn: Story = { args: { step: "rsvpToggleOn" } };
export const CapacityLimit: Story = { args: { step: "capacityLimit" } };
export const CompanionAllowed: Story = { args: { step: "companionAllowed" } };
export const CompanionNotAllowed: Story = { args: { step: "companionNotAllowed" } };
export const RsvpDeadline: Story = { args: { step: "rsvpDeadline" } };
export const AdditionalQuestionList: Story = { args: { step: "additionalQuestionList" } };
export const AddTextQuestion: Story = { args: { step: "addTextQuestion" } };
export const AddSingleChoiceQuestion: Story = { args: { step: "addSingleChoiceQuestion" } };
export const AddMultipleChoiceQuestion: Story = { args: { step: "addMultipleChoiceQuestion" } };
export const RequiredQuestionToggle: Story = { args: { step: "requiredQuestionToggle" } };
export const QuestionDeleteModal: Story = { args: { step: "questionDeleteModal" } };

// Privacy
export const PrivacyPublic: Story = { args: { step: "privacyPublic" } };
export const PrivacyLinkOnly: Story = { args: { step: "privacyLinkOnly" } };
export const PrivacyPasswordProtected: Story = { args: { step: "privacyPasswordProtected" } };
export const PrivacyPasswordInput: Story = { args: { step: "privacyPasswordInput" } };
export const ParticipantListPublicToggle: Story = { args: { step: "participantListPublicToggle" } };
export const CommentToggle: Story = { args: { step: "commentToggle" } };
export const AlbumToggle: Story = { args: { step: "albumToggle" } };
export const SearchExposureToggle: Story = { args: { step: "searchExposureToggle" } };

// Design
export const DesignStyle: Story = { args: { step: "designStyle" } };
export const BackgroundColor: Story = { args: { step: "backgroundColor" } };
export const FontSelect: Story = { args: { step: "fontSelect" } };
export const ButtonColor: Story = { args: { step: "buttonColor" } };
export const StickerSelect: Story = { args: { step: "stickerSelect" } };
export const StickerPosition: Story = { args: { step: "stickerPosition" } };
export const LayoutSelect: Story = { args: { step: "layoutSelect" } };
export const PosterType: Story = { args: { step: "posterType" } };
export const CardType: Story = { args: { step: "cardType" } };
export const FeedType: Story = { args: { step: "feedType" } };
export const Y2kStyle: Story = { args: { step: "y2kStyle" } };
export const MinimalStyle: Story = { args: { step: "minimalStyle" } };
export const Preview: Story = { args: { step: "preview" } };
export const FullscreenPreview: Story = { args: { step: "fullscreenPreview" } };

// Save / Publish
export const DraftSavedToast: Story = { args: { step: "draftSavedToast" } };
export const LeaveWithoutSaveModal: Story = { args: { step: "leaveWithoutSaveModal" } };
export const RequiredFieldsError: Story = { args: { step: "requiredFieldsError" } };
export const SavingLoading: Story = { args: { step: "savingLoading" } };
export const SaveFailed: Story = { args: { step: "saveFailed" } };
export const PublishConfirm: Story = { args: { step: "publishConfirm" } };
export const PublishingLoading: Story = { args: { step: "publishingLoading" } };
export const PublishComplete: Story = { args: { step: "publishComplete" } };
export const ShareCta: Story = { args: { step: "shareCta" } };
export const LinkCopiedToast: Story = { args: { step: "linkCopiedToast" } };
export const QrGenerated: Story = { args: { step: "qrGenerated" } };
export const InstagramImageSaved: Story = { args: { step: "instagramImageSaved" } };

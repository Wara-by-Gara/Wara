import type { Meta, StoryObj } from "@storybook/react";
import { MapPage } from "./MapPage";

const meta: Meta<typeof MapPage> = {
  title: "Pages/13 Map/Page",
  component: MapPage,
  parameters: { layout: "fullscreen", viewport: { defaultViewport: "mobile" } },
};
export default meta;
type Story = StoryObj<typeof MapPage>;

export const PreviewInInvitation: Story = { args: { state: "previewInInvitation" } };
export const Fullscreen: Story = { args: { state: "fullscreen" } };
export const Loading: Story = { args: { state: "loading" } };
export const ErrorState: Story = { args: { state: "error" } };
export const NoLocation: Story = { args: { state: "noLocation" } };
export const SearchInitial: Story = { args: { state: "searchInitial" } };
export const SearchTyping: Story = { args: { state: "searchTyping" } };
export const SearchResults: Story = { args: { state: "searchResults" } };
export const SearchEmpty: Story = { args: { state: "searchEmpty" } };
export const SelectedPlace: Story = { args: { state: "selectedPlace" } };
export const ManualAddress: Story = { args: { state: "manualAddress" } };
export const CurrentLocationPermission: Story = { args: { state: "currentLocationPermission" } };
export const PermissionDenied: Story = { args: { state: "permissionDenied" } };
export const PermissionSettingsGuide: Story = { args: { state: "permissionSettingsGuide" } };
export const DirectionBottomSheet: Story = { args: { state: "directionBottomSheet" } };
export const OpenKakaoMap: Story = { args: { state: "openKakaoMap" } };
export const OpenNaverMap: Story = { args: { state: "openNaverMap" } };
export const OpenGoogleMap: Story = { args: { state: "openGoogleMap" } };
export const NoMapAppGuide: Story = { args: { state: "noMapAppGuide" } };
export const OnlineMeetingLink: Story = { args: { state: "onlineMeetingLink" } };

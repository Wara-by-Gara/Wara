import type { Meta, StoryObj } from "@storybook/react";
import { Signup } from "./Signup";

const meta: Meta<typeof Signup> = {
  title: "Pages/04 Signup/Page",
  component: Signup,
  parameters: { layout: "fullscreen", viewport: { defaultViewport: "mobile" } },
};
export default meta;
type Story = StoryObj<typeof Signup>;

export const TermsAgreement: Story = { args: { step: "termsAgreement" } };
export const TermsDetail: Story = { args: { step: "termsDetail" } };
export const PrivacyDetail: Story = { args: { step: "privacyDetail" } };
export const MarketingAgreement: Story = { args: { step: "marketingAgreement" } };
export const NicknameInput: Story = { args: { step: "nicknameInput" } };
export const NicknameError: Story = { args: { step: "nicknameError" } };
export const ProfileImageSelect: Story = { args: { step: "profileImageSelect" } };
export const ProfileImageCrop: Story = { args: { step: "profileImageCrop" } };
export const Complete: Story = { args: { step: "complete" } };
export const Failed: Story = { args: { step: "failed" } };

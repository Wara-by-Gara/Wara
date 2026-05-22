import type { Meta, StoryObj } from '@storybook/react';
import { Login } from './Login';
import { pageStoryParameters } from '../../../.storybook/pageStoryParameters';

const meta: Meta<typeof Login> = {
  title: 'Pages/03 Login/Page',
  component: Login,
  parameters: pageStoryParameters,
};
export default meta;
type Story = StoryObj<typeof Login>;

export const DefaultGoogle: Story = { name: 'Default - Google' };
export const DefaultApple: Story = {
  name: 'Default - Apple',
  args: { thirdProvider: 'apple' },
};
export const WithInvitationContext: Story = {
  args: { state: 'withInvitationContext', invitationTitle: '와라의 생일 파티' },
};
export const KakaoLoading: Story = { args: { state: 'kakaoLoading' } };
export const NaverLoading: Story = { args: { state: 'naverLoading' } };
export const GoogleLoading: Story = { args: { state: 'googleLoading' } };
export const AppleLoading: Story = {
  args: { state: 'appleLoading', thirdProvider: 'apple' },
};
export const SocialFailed: Story = { args: { state: 'socialFailed' } };
export const SocialCancelled: Story = { args: { state: 'socialCancelled' } };
export const AccountBlocked: Story = { args: { state: 'accountBlocked' } };
export const WithdrawnAccount: Story = { args: { state: 'withdrawnAccount' } };
export const SessionExpiredModal: Story = {
  args: { state: 'sessionExpiredModal' },
};
export const LoginRequiredBottomSheet: Story = {
  args: { state: 'loginRequiredBottomSheet' },
};
export const ContinueWithoutLogin: Story = {
  args: { state: 'continueWithoutLogin' },
};

import type { Meta, StoryObj } from '@storybook/react';
import { Notifications } from './Notifications';
import { pageStoryParameters } from '../../../.storybook/pageStoryParameters';

const meta: Meta<typeof Notifications> = {
  title: 'Pages/16 Notifications/Page',
  component: Notifications,
  parameters: pageStoryParameters,
};
export default meta;
type Story = StoryObj<typeof Notifications>;

export const Default: Story = { args: { state: 'default' } };
export const Empty: Story = { args: { state: 'empty' } };
export const Loading: Story = { args: { state: 'loading' } };
export const ErrorState: Story = { args: { state: 'error' } };
export const UnreadOnly: Story = { args: { state: 'unreadOnly' } };
export const DateGrouped: Story = { args: { state: 'dateGrouped' } };
export const MarkAllReadModal: Story = { args: { state: 'markAllReadModal' } };
export const Settings: Story = { args: { state: 'settings' } };
export const PushPermissionGuide: Story = {
  args: { state: 'pushPermissionGuide' },
};
export const PushDisabledGuide: Story = {
  args: { state: 'pushDisabledGuide' },
};

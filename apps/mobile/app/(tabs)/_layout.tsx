import { NativeTabs, Icon, Label } from 'expo-router/unstable-native-tabs';

import { ios } from '@/theme';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { useTermsGuard } from '@/hooks/useTermsGuard';

export default function TabLayout() {
  const { isReady } = useAuthGuard();
  if (!isReady) return null;
  return <AuthenticatedTabs />;
}

function AuthenticatedTabs() {
  useTermsGuard();

  return (
    <NativeTabs tintColor={ios.tint}>
      <NativeTabs.Trigger name="index">
        <Icon sf="house.fill" />
        <Label>홈</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="invitations">
        <Icon sf="envelope.fill" />
        <Label>초대장</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="photos">
        <Icon sf="photo.on.rectangle.angled" />
        <Label>사진</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="notifications">
        <Icon sf="bell.fill" />
        <Label>알림</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <Icon sf="person.fill" />
        <Label>마이</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

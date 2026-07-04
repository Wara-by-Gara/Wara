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
      <NativeTabs.Trigger name="meetings">
        <Icon sf="calendar" />
        <Label>일정</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="create">
        <Icon sf="plus.circle.fill" />
        <Label>만들기</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="friends">
        <Icon sf="person.2.fill" />
        <Label>친구</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <Icon sf="person.fill" />
        <Label>프로필</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

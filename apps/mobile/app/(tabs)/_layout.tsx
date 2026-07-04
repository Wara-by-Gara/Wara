import { Tabs } from 'expo-router';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
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
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarActiveTintColor: ios.tint,
        tabBarInactiveTintColor: ios.secondaryLabel,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: '홈',
          tabBarIcon: ({ color }: { color: string }) => <IconSymbol size={26} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="invitations"
        options={{
          title: '초대장',
          tabBarIcon: ({ color }: { color: string }) => <IconSymbol size={26} name="envelope.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="photos"
        options={{
          title: '사진',
          tabBarIcon: ({ color }: { color: string }) => <IconSymbol size={26} name="photo.on.rectangle.angled" color={color} />,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: '알림',
          tabBarIcon: ({ color }: { color: string }) => <IconSymbol size={26} name="bell.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: '마이',
          tabBarIcon: ({ color }: { color: string }) => <IconSymbol size={26} name="person.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}

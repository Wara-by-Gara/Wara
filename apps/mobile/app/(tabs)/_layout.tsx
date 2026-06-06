import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { useTermsGuard } from '@/hooks/useTermsGuard';

export default function TabLayout() {
  const { isReady } = useAuthGuard();
  if (!isReady) return null;
  return <AuthenticatedTabs />;
}

function AuthenticatedTabs() {
  const colorScheme = useColorScheme();
  useTermsGuard();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }: { color: string }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'My',
          tabBarIcon: ({ color }: { color: string }) => <IconSymbol size={28} name="person.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}

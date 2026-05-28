import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { router, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider, useAuth } from '@/hooks/use-auth';
import { QueryProvider } from '@/providers/query-provider';

export const unstable_settings = {
  anchor: '(tabs)',
};

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { isLoggedIn, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (!isLoggedIn) {
      router.replace('/login');
    } else {
      router.replace('/(tabs)');
    }
  }, [isLoggedIn, isLoading]);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="invitations/create" options={{ title: '초대장 만들기', headerBackTitle: '뒤로' }} />
        <Stack.Screen name="invitations/[id]/index" options={{ headerBackTitle: '뒤로' }} />
        <Stack.Screen name="invitations/[id]/comments" options={{ title: '댓글', headerBackTitle: '뒤로' }} />
        <Stack.Screen name="invitations/[id]/location" options={{ title: '장소', headerBackTitle: '뒤로' }} />
        <Stack.Screen name="invitations/[id]/participants" options={{ title: '참가자', headerBackTitle: '뒤로' }} />
        <Stack.Screen name="profile/edit" options={{ title: '프로필 수정', headerBackTitle: '뒤로' }} />
        <Stack.Screen name="profile/account" options={{ title: '계정 설정', headerBackTitle: '뒤로' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <QueryProvider>
      <AuthProvider>
        <RootLayoutNav />
      </AuthProvider>
    </QueryProvider>
  );
}

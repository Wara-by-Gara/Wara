import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { QueryProvider } from '@/providers/query-provider';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <QueryProvider>
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
    </QueryProvider>
  );
}

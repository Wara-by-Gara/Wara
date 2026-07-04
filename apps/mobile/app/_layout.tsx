import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { PushRegistrar } from '@/components/PushRegistrar';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { QueryProvider } from '@/providers/query-provider';
import { resolveIosHex } from '@/theme';

import '@/api/social-auth';

export const unstable_settings = {
  anchor: '(tabs)',
};

/** iOS 시스템 컬러(hex)로 구성한 react-navigation 테마. */
function useNavTheme(): typeof DefaultTheme {
  const scheme = useColorScheme() ?? 'light';
  const hex = resolveIosHex(scheme);
  const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
  return {
    ...base,
    colors: {
      ...base.colors,
      primary: hex.tint,
      background: hex.systemGroupedBackground,
      card: hex.systemBackground,
      text: hex.label,
      border: hex.separator,
    },
  };
}

export default function RootLayout() {
  const navTheme = useNavTheme();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryProvider>
          <BottomSheetModalProvider>
            <ThemeProvider value={navTheme}>
              <Stack
                screenOptions={{
                  headerLargeTitle: true,
                  headerLargeTitleShadowVisible: false,
                  headerTransparent: true,
                  headerBlurEffect: 'systemChromeMaterial',
                  headerBackButtonDisplayMode: 'minimal',
                }}>
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="login" options={{ headerShown: false, presentation: 'fullScreenModal' }} />
                {__DEV__ && <Stack.Screen name="dev-login" options={{ headerShown: false }} />}
                <Stack.Screen name="terms-agree" options={{ headerShown: false }} />
                <Stack.Screen name="signup" options={{ headerShown: false }} />
                <Stack.Screen name="invitations/[id]" options={{ headerShown: false }} />
                <Stack.Screen name="invitations/create" options={{ headerShown: false, presentation: 'modal' }} />
                <Stack.Screen name="chat" options={{ headerShown: false }} />
                <Stack.Screen name="friends" options={{ headerShown: false }} />
                <Stack.Screen name="settings" options={{ headerShown: false }} />
                <Stack.Screen name="support" options={{ headerShown: false }} />
                <Stack.Screen name="explore/index" options={{ title: '둘러보기', headerLargeTitle: true }} />
                <Stack.Screen name="photos/map" options={{ title: '사진 지도' }} />
              </Stack>
              {/* 로그인 상태에서만 내부적으로 푸시 토큰 등록(훅이 토큰 유무로 게이팅). */}
              <PushRegistrar />
              <StatusBar style="auto" />
            </ThemeProvider>
          </BottomSheetModalProvider>
        </QueryProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

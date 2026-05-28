import * as AppleAuthentication from 'expo-apple-authentication';
import { Stack } from 'expo-router';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { colors, palette, radius, spacing, typography } from '@/constants/tokens';
import { useAuth } from '@/hooks/use-auth';

export default function LoginScreen() {
  const { loginWithKakao, loginWithNaver, loginWithApple } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const handleKakao = async () => {
    setError(null);
    try {
      await loginWithKakao();
    } catch (e) {
      setError(e instanceof Error ? e.message : '카카오 로그인 실패');
    }
  };

  const handleNaver = async () => {
    setError(null);
    try {
      await loginWithNaver();
    } catch (e) {
      setError(e instanceof Error ? e.message : '네이버 로그인 실패');
    }
  };

  const handleApple = async () => {
    setError(null);
    try {
      await loginWithApple();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Apple 로그인 실패');
    }
  };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.hero}>
        <ThemedText type="title" style={styles.title}>
          와라
        </ThemedText>
        <ThemedText style={styles.subtitle}>소중한 사람들과 함께하는 순간</ThemedText>
      </View>

      <View style={styles.buttons}>
        {error && (
          <ThemedText style={styles.errorText}>{error}</ThemedText>
        )}

        <Pressable
          style={[styles.button, styles.kakaoButton]}
          onPress={handleKakao}
          accessibilityLabel="카카오로 로그인"
        >
          <ThemedText style={[styles.buttonText, styles.kakaoText]}>카카오로 시작하기</ThemedText>
        </Pressable>

        <Pressable
          style={[styles.button, styles.naverButton]}
          onPress={handleNaver}
          accessibilityLabel="네이버로 로그인"
        >
          <ThemedText style={[styles.buttonText, styles.lightText]}>네이버로 시작하기</ThemedText>
        </Pressable>

        {Platform.OS === 'ios' && (
          <AppleAuthentication.AppleAuthenticationButton
            buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
            buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
            cornerRadius={radius.md}
            style={styles.appleButton}
            onPress={handleApple}
          />
        )}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing[6],
    justifyContent: 'space-between',
    paddingTop: spacing[16],
    paddingBottom: spacing[10],
  },
  hero: {
    alignItems: 'center',
    gap: spacing[2],
  },
  title: {
    ...typography.display1,
    color: colors.primary,
  },
  subtitle: {
    ...typography.body1,
    color: colors.textSecondary,
  },
  buttons: {
    gap: spacing[3],
  },
  errorText: {
    ...typography.caption1,
    color: colors.danger,
    textAlign: 'center',
  },
  button: {
    height: 52,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kakaoButton: {
    backgroundColor: palette.yellow300,
  },
  naverButton: {
    backgroundColor: palette.green500,
  },
  buttonText: {
    ...typography.buttonLarge,
  },
  kakaoText: {
    color: palette.black,
  },
  lightText: {
    color: colors.textInverse,
  },
  appleButton: {
    height: 52,
  },
});

import * as AppleAuthentication from 'expo-apple-authentication';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { useEffect, useState } from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { apiFetch, setTokens } from '@/api';
import { colors, layout, radius, spacing, typography } from '@/constants/tokens';

type LoadingProvider = 'kakao' | 'naver' | 'google' | 'apple' | null;
type LoginError = 'cancelled' | 'failed' | null;

export default function LoginScreen() {
  const [appleAvailable, setAppleAvailable] = useState(false);
  const [loading, setLoading] = useState<LoadingProvider>(null);
  const [error, setError] = useState<LoginError>(null);

  useEffect(() => {
    if (Platform.OS === 'ios') {
      AppleAuthentication.isAvailableAsync().then(setAppleAvailable);
    }
  }, []);

  async function handleSocialLogin(provider: 'kakao' | 'naver' | 'google') {
    setLoading(provider);
    setError(null);
    try {
      const { url, state } = await apiFetch<{ url: string; state: string }>(
        `/auth/${provider}/url?platform=MOBILE`,
        { authenticated: false },
      );

      const result = await WebBrowser.openAuthSessionAsync(url, 'wara://auth/callback');

      if (result.type !== 'success') {
        setError('cancelled');
        return;
      }

      const parsed = Linking.parse(result.url);
      const code = parsed.queryParams?.code as string | undefined;
      const returnedState = parsed.queryParams?.state as string | undefined;

      if (!code) {
        setError('failed');
        return;
      }

      const tokens = await apiFetch<{ accessToken: string; refreshToken: string }>(
        `/auth/${provider}/callback?platform=MOBILE`,
        { method: 'POST', body: { code, state: returnedState ?? state }, authenticated: false },
      );

      await setTokens({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken });
      router.replace('/(tabs)');
    } catch {
      setError('failed');
    } finally {
      setLoading(null);
    }
  }

  async function handleApple() {
    setLoading('apple');
    setError(null);
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (!credential.identityToken || !credential.authorizationCode) {
        setError('failed');
        return;
      }

      const tokens = await apiFetch<{ accessToken: string; refreshToken: string }>(
        '/auth/apple/callback?platform=MOBILE',
        {
          method: 'POST',
          body: { id_token: credential.identityToken, code: credential.authorizationCode },
          authenticated: false,
        },
      );

      await setTokens({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken });
      router.replace('/(tabs)');
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'code' in err && (err as { code: string }).code === 'ERR_CANCELED') {
        setError('cancelled');
      } else {
        setError('failed');
      }
    } finally {
      setLoading(null);
    }
  }

  const errorMessage =
    error === 'cancelled'
      ? '로그인이 취소되었어요.'
      : error === 'failed'
        ? '로그인에 실패했어요. 잠시 후 다시 시도해 주세요.'
        : null;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.brandArea}>
        <Text style={styles.logo}>Wara</Text>
        <Text style={styles.tagline}>소중한 모임, 함께 기억해요</Text>
      </View>

      <View style={styles.buttonArea}>
        <TouchableOpacity
          style={[styles.socialButton, styles.kakaoButton, loading !== null && styles.disabledButton]}
          onPress={() => handleSocialLogin('kakao')}
          activeOpacity={0.85}
          disabled={loading !== null}
        >
          <Text style={[styles.socialButtonText, styles.kakaoText]}>
            {loading === 'kakao' ? '로그인 중...' : '카카오로 시작하기'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.socialButton, styles.naverButton, loading !== null && styles.disabledButton]}
          onPress={() => handleSocialLogin('naver')}
          activeOpacity={0.85}
          disabled={loading !== null}
        >
          <Text style={[styles.socialButtonText, styles.naverText]}>
            {loading === 'naver' ? '로그인 중...' : '네이버로 시작하기'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.socialButton, styles.googleButton, loading !== null && styles.disabledButton]}
          onPress={() => handleSocialLogin('google')}
          activeOpacity={0.85}
          disabled={loading !== null}
        >
          <Text style={[styles.socialButtonText, styles.googleText]}>
            {loading === 'google' ? '로그인 중...' : '구글로 시작하기'}
          </Text>
        </TouchableOpacity>

        {appleAvailable && (
          <AppleAuthentication.AppleAuthenticationButton
            buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
            buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
            cornerRadius={radius.lg}
            style={styles.appleButton}
            onPress={handleApple}
          />
        )}

        {errorMessage !== null && (
          <Text style={styles.errorMessage}>{errorMessage}</Text>
        )}

        <Text style={styles.termsNotice}>
          시작하면 <Text style={styles.termsLink}>이용약관</Text> 및{' '}
          <Text style={styles.termsLink}>개인정보 처리방침</Text>에 동의하게 됩니다.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: layout.pagePadding,
    justifyContent: 'space-between',
  },
  brandArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    ...typography.display1,
    color: colors.primary,
    marginBottom: spacing[2],
  },
  tagline: {
    ...typography.body2,
    color: colors.textSecondary,
  },
  buttonArea: {
    gap: spacing[3],
    paddingBottom: spacing[4],
  },
  socialButton: {
    height: 56,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kakaoButton: {
    backgroundColor: '#FEE500',
  },
  naverButton: {
    backgroundColor: '#03C75A',
  },
  googleButton: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#dadce0',
  },
  disabledButton: {
    opacity: 0.6,
  },
  socialButtonText: {
    ...typography.buttonLarge,
  },
  kakaoText: {
    color: '#181600',
  },
  naverText: {
    color: '#ffffff',
  },
  googleText: {
    color: '#3c4043',
  },
  appleButton: {
    height: 56,
    width: '100%',
  },
  errorMessage: {
    ...typography.caption1,
    color: colors.danger,
    textAlign: 'center',
  },
  termsNotice: {
    ...typography.caption1,
    color: colors.textTertiary,
    textAlign: 'center',
    marginTop: spacing[1],
  },
  termsLink: {
    color: colors.textSecondary,
    textDecorationLine: 'underline',
  },
});

import * as AppleAuthentication from 'expo-apple-authentication';
import Constants from 'expo-constants';
import { useEffect, useState } from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { login as kakaoLogin } from '@react-native-kakao/user';
import NaverLogin from '@react-native-seoul/naver-login';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

import { apiFetch, setTokens } from '@/api';
import { colors, layout, radius, spacing, typography } from '@/constants/tokens';

type LoadingProvider = 'kakao' | 'naver' | 'google' | 'apple' | null;
type LoginError = 'cancelled' | 'failed' | null;

type AuthResult = {
  accessToken: string;
  refreshToken: string;
  isNew: boolean;
  needsProfileCompletion: boolean;
};

const extra = Constants.expoConfig?.extra as {
  googleWebClientId?: string;
  googleIosClientId?: string;
  naverClientId?: string;
  naverClientSecret?: string;
} | undefined;

GoogleSignin.configure({
  webClientId: extra?.googleWebClientId ?? '',
  iosClientId: extra?.googleIosClientId,
  scopes: ['email', 'profile'],
});

export default function LoginScreen() {
  const [appleAvailable, setAppleAvailable] = useState(false);
  const [loading, setLoading] = useState<LoadingProvider>(null);
  const [error, setError] = useState<LoginError>(null);

  useEffect(() => {
    if (Platform.OS === 'ios') {
      AppleAuthentication.isAvailableAsync().then(setAppleAvailable);
    }
    NaverLogin.initialize({
      appName: 'Wara',
      consumerKey: extra?.naverClientId ?? '',
      consumerSecret: extra?.naverClientSecret ?? '',
      serviceUrlSchemeIOS: 'wara',
    });
  }, []);

  async function handleKakao() {
    setLoading('kakao');
    setError(null);
    try {
      const result = await kakaoLogin();
      const { accessToken, refreshToken, needsProfileCompletion } = await apiFetch<AuthResult>('/auth/kakao/token', {
        method: 'POST',
        body: { providerToken: result.accessToken },
        authenticated: false,
      });
      await setTokens({ accessToken, refreshToken });
      router.replace(needsProfileCompletion ? '/signup' : '/(tabs)');
    } catch (err) {
      if (__DEV__) console.warn('[kakao login]', err);
      setError('failed');
    } finally {
      setLoading(null);
    }
  }

  async function handleNaver() {
    setLoading('naver');
    setError(null);
    try {
      const { isSuccess, successResponse, failureResponse } = await NaverLogin.login();
      if (!isSuccess || !successResponse) {
        setError(failureResponse?.isCancel ? 'cancelled' : 'failed');
        return;
      }
      const { accessToken, refreshToken, needsProfileCompletion } = await apiFetch<AuthResult>('/auth/naver/token', {
        method: 'POST',
        body: { providerToken: successResponse.accessToken },
        authenticated: false,
      });
      await setTokens({ accessToken, refreshToken });
      router.replace(needsProfileCompletion ? '/signup' : '/(tabs)');
    } catch (err) {
      if (__DEV__) console.warn('[naver login]', err);
      setError('failed');
    } finally {
      setLoading(null);
    }
  }

  async function handleGoogle() {
    setLoading('google');
    setError(null);
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const response = await GoogleSignin.signIn();
      if (response.type === 'cancelled') {
        setError('cancelled');
        return;
      }
      if (response.type !== 'success' || !response.data.idToken) {
        setError('failed');
        return;
      }
      const { accessToken, refreshToken, needsProfileCompletion } = await apiFetch<AuthResult>('/auth/google/token', {
        method: 'POST',
        body: { providerToken: response.data.idToken },
        authenticated: false,
      });
      await setTokens({ accessToken, refreshToken });
      router.replace(needsProfileCompletion ? '/signup' : '/(tabs)');
    } catch (err) {
      if (__DEV__) console.warn('[google login]', err);
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

      const user = credential.fullName
        ? {
            name: {
              firstName: credential.fullName.givenName ?? undefined,
              lastName: credential.fullName.familyName ?? undefined,
            },
            email: credential.email ?? undefined,
          }
        : undefined;

      const { accessToken, refreshToken, needsProfileCompletion } = await apiFetch<AuthResult>(
        '/auth/apple/callback?platform=mobile',
        {
          method: 'POST',
          body: {
            id_token: credential.identityToken,
            code: credential.authorizationCode,
            ...(user !== undefined && { user }),
          },
          authenticated: false,
        },
      );
      await setTokens({ accessToken, refreshToken });
      router.replace(needsProfileCompletion ? '/signup' : '/(tabs)');
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'code' in err && (err as { code: string }).code === 'ERR_CANCELED') {
        setError('cancelled');
      } else {
        if (__DEV__) console.warn('[apple login]', err);
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
          onPress={handleKakao}
          activeOpacity={0.85}
          disabled={loading !== null}
        >
          <Text style={[styles.socialButtonText, styles.kakaoText]}>
            {loading === 'kakao' ? '로그인 중...' : '카카오로 시작하기'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.socialButton, styles.naverButton, loading !== null && styles.disabledButton]}
          onPress={handleNaver}
          activeOpacity={0.85}
          disabled={loading !== null}
        >
          <Text style={[styles.socialButtonText, styles.naverText]}>
            {loading === 'naver' ? '로그인 중...' : '네이버로 시작하기'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.socialButton, styles.googleButton, loading !== null && styles.disabledButton]}
          onPress={handleGoogle}
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
          시작하면 <Text style={styles.termsLink} onPress={() => router.push('/terms-agree')}>이용약관</Text> 및{' '}
          <Text style={styles.termsLink} onPress={() => router.push('/terms-agree')}>개인정보 처리방침</Text>에 동의하게 됩니다.
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

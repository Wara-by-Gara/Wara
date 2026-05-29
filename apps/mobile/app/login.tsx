import * as AppleAuthentication from 'expo-apple-authentication';
import { useEffect, useState } from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, layout, radius, spacing, typography } from '@/constants/tokens';

export default function LoginScreen() {
  const [appleAvailable, setAppleAvailable] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'ios') {
      AppleAuthentication.isAvailableAsync().then(setAppleAvailable);
    }
  }, []);

  function handleKakao() {
    // TODO: OAuth 구현 시 연결
  }

  function handleNaver() {
    // TODO: OAuth 구현 시 연결
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.brandArea}>
        <Text style={styles.logo}>Wara</Text>
        <Text style={styles.tagline}>소중한 모임, 함께 기억해요</Text>
      </View>

      <View style={styles.buttonArea}>
        <TouchableOpacity style={[styles.socialButton, styles.kakaoButton]} onPress={handleKakao} activeOpacity={0.85}>
          <Text style={[styles.socialButtonText, styles.kakaoText]}>카카오로 시작하기</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.socialButton, styles.naverButton]} onPress={handleNaver} activeOpacity={0.85}>
          <Text style={[styles.socialButtonText, styles.naverText]}>네이버로 시작하기</Text>
        </TouchableOpacity>

        {appleAvailable && (
          <AppleAuthentication.AppleAuthenticationButton
            buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
            buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
            cornerRadius={radius.lg}
            style={styles.appleButton}
            onPress={() => {
              // TODO: OAuth 구현 시 연결
            }}
          />
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
  socialButtonText: {
    ...typography.buttonLarge,
  },
  kakaoText: {
    color: '#181600',
  },
  naverText: {
    color: '#ffffff',
  },
  appleButton: {
    height: 56,
    width: '100%',
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

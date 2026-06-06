import Constants from 'expo-constants';
import { initializeKakaoSDK } from '@react-native-kakao/core';
import { logout as kakaoLogout } from '@react-native-kakao/user';
import NaverLogin from '@react-native-seoul/naver-login';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

import { WaraApiError, WaraNetworkError } from './types';

type SocialAuthExtra = {
  kakaoNativeKey?: string;
  naverClientId?: string;
  naverClientSecret?: string;
  googleWebClientId?: string;
  googleIosClientId?: string;
};

const extra = (Constants.expoConfig?.extra ?? {}) as SocialAuthExtra;

if (__DEV__) {
  if (!extra.kakaoNativeKey) console.warn('[social-auth] EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY 누락');
  if (!extra.naverClientId) console.warn('[social-auth] EXPO_PUBLIC_NAVER_CLIENT_ID 누락');
  if (!extra.naverClientSecret) console.warn('[social-auth] EXPO_PUBLIC_NAVER_CLIENT_SECRET 누락');
  if (!extra.googleWebClientId) console.warn('[social-auth] EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID 누락');
}

if (extra.naverClientId && extra.naverClientSecret) {
  NaverLogin.initialize({
    appName: 'Wara',
    consumerKey: extra.naverClientId,
    consumerSecret: extra.naverClientSecret,
    serviceUrlSchemeIOS: 'wara',
  });
}

if (extra.googleWebClientId) {
  GoogleSignin.configure({
    webClientId: extra.googleWebClientId,
    iosClientId: extra.googleIosClientId,
    scopes: ['email', 'profile'],
  });
}

let kakaoInitPromise: Promise<void> | null = null;

export function ensureKakaoSDK(): Promise<void> {
  if (!kakaoInitPromise) {
    if (!extra.kakaoNativeKey) {
      return Promise.reject(
        new Error('Kakao native app key가 설정되지 않았습니다. EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY 확인.'),
      );
    }
    kakaoInitPromise = initializeKakaoSDK(extra.kakaoNativeKey).catch((err) => {
      kakaoInitPromise = null;
      throw err;
    });
  }
  return kakaoInitPromise;
}

ensureKakaoSDK().catch((err) => {
  if (__DEV__) console.warn('[social-auth] Kakao init 실패', err);
});

export async function clearAllSocialSessions(): Promise<void> {
  await Promise.allSettled([
    kakaoLogout().catch(() => undefined),
    NaverLogin.logout().catch(() => undefined),
    GoogleSignin.signOut().catch(() => undefined),
  ]);
}

export function isKakaoCancellation(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const e = err as { code?: unknown; message?: unknown };
  const code = typeof e.code === 'string' ? e.code.toLowerCase() : '';
  const msg = typeof e.message === 'string' ? e.message.toLowerCase() : '';
  return code.includes('cancel') || msg.includes('cancel');
}

export const LOGIN_CANCELLED_MESSAGE = '로그인이 취소되었어요.';

export function describeLoginError(err: unknown): string {
  if (err instanceof WaraNetworkError) {
    return '네트워크 연결을 확인해 주세요.';
  }
  if (err instanceof WaraApiError) {
    switch (err.code) {
      case 'AUTH_PROVIDER_TOKEN_INVALID':
      case 'AUTH_INVALID_TOKEN':
        return '소셜 인증에 실패했어요. 다시 시도해 주세요.';
      case 'APPLE_SERVER_TIMEOUT':
        return 'Apple 서버 응답이 늦어지고 있어요. 잠시 후 다시 시도해 주세요.';
      case 'AUTH_USER_NOT_FOUND':
        return '사용자 정보를 불러올 수 없어요. 잠시 후 다시 시도해 주세요.';
      case 'TERMS_AGREEMENT_REQUIRED':
        return '서비스 이용약관에 먼저 동의해 주세요.';
      case 'SOCIAL_ALREADY_LINKED':
        return '이 소셜 계정은 다른 wara 계정에 연결되어 있어요.';
      case 'USER_SOCIAL_LAST_LINKED':
        return '마지막 소셜 계정은 해제할 수 없어요.';
      case 'MERGE_TOKEN_INVALID':
        return '계정 합치기 요청이 만료됐어요. 다시 시도해 주세요.';
      case 'SUSPICIOUS_REFRESH':
        return '의심스러운 활동이 감지돼 자동 로그아웃됐어요. 다시 로그인해 주세요.';
      case 'USER_HAS_HOSTED_INVITATIONS':
        return '호스트로 진행 중인 초대장이 있어요. 다른 멤버에게 호스트 권한을 넘긴 뒤 탈퇴해 주세요.';
    }
  }
  return '로그인에 실패했어요. 잠시 후 다시 시도해 주세요.';
}

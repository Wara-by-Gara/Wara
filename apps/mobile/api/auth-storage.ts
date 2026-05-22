import * as SecureStore from 'expo-secure-store';

// JWT는 SecureStore에 저장 — iOS Keychain / Android EncryptedSharedPreferences.
// AsyncStorage는 암호화 안 됨이라 토큰 같은 시크릿엔 부적합.
// 주의: SecureStore는 web 플랫폼 미지원 — V1.0 mobile 타깃은 iOS/Android.
// 향후 web 지원 필요 시 .web.ts 확장으로 별도 구현(localStorage 등) 추가.
const ACCESS_TOKEN_KEY = 'wara.auth.accessToken';
const REFRESH_TOKEN_KEY = 'wara.auth.refreshToken';

export async function getAccessToken(): Promise<string | null> {
  return SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
}

export async function setTokens(params: {
  accessToken: string;
  /** dev-auth는 access만 반환하므로 optional. prod 흐름에선 항상 함께 전달. */
  refreshToken?: string;
}): Promise<void> {
  await Promise.all([
    SecureStore.setItemAsync(ACCESS_TOKEN_KEY, params.accessToken),
    params.refreshToken === undefined
      ? Promise.resolve()
      : SecureStore.setItemAsync(REFRESH_TOKEN_KEY, params.refreshToken),
  ]);
}

export async function getRefreshToken(): Promise<string | null> {
  return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
}

export async function clearTokens(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
    SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
  ]);
}

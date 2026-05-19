import * as SecureStore from 'expo-secure-store';

// JWT는 SecureStore에 저장 — iOS Keychain / Android EncryptedSharedPreferences.
// AsyncStorage는 암호화 안 됨이라 토큰 같은 시크릿엔 부적합.
const ACCESS_TOKEN_KEY = 'wara.auth.accessToken';
const REFRESH_TOKEN_KEY = 'wara.auth.refreshToken';

export async function getAccessToken(): Promise<string | null> {
  return SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
}

export async function setTokens(params: {
  accessToken: string;
  refreshToken: string;
}): Promise<void> {
  await Promise.all([
    SecureStore.setItemAsync(ACCESS_TOKEN_KEY, params.accessToken),
    SecureStore.setItemAsync(REFRESH_TOKEN_KEY, params.refreshToken),
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

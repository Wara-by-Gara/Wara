import * as AppleAuthentication from 'expo-apple-authentication';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

import {
  getAppleState,
  getOAuthUrl,
  postAppleCallback,
  postLogout,
} from '@/api/auth';
import { clearTokens, getAccessToken, getRefreshToken, setTokens } from '@/api/auth-storage';

type AuthContextValue = {
  isLoggedIn: boolean;
  isLoading: boolean;
  loginWithKakao: () => Promise<void>;
  loginWithNaver: () => Promise<void>;
  loginWithApple: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getAccessToken()
      .then((token) => setIsLoggedIn(!!token))
      .finally(() => setIsLoading(false));
  }, []);

  const handleOAuthLogin = useCallback(async (provider: 'kakao' | 'naver') => {
    const { url } = await getOAuthUrl(provider);
    const result = await WebBrowser.openAuthSessionAsync(url, 'wara://');
    if (result.type !== 'success') return;

    const { queryParams } = Linking.parse(result.url);
    const accessToken = queryParams?.accessToken as string | undefined;
    const refreshToken = queryParams?.refreshToken as string | undefined;
    if (!accessToken || !refreshToken) {
      throw new Error('OAuth 콜백 토큰 누락');
    }

    await setTokens({ accessToken, refreshToken });
    setIsLoggedIn(true);
  }, []);

  const loginWithKakao = useCallback(() => handleOAuthLogin('kakao'), [handleOAuthLogin]);
  const loginWithNaver = useCallback(() => handleOAuthLogin('naver'), [handleOAuthLogin]);

  const loginWithApple = useCallback(async () => {
    const { state } = await getAppleState();
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });
    if (!credential.identityToken || !credential.authorizationCode) {
      throw new Error('Apple 인증 자격증명 누락');
    }
    const tokens = await postAppleCallback({
      id_token: credential.identityToken,
      code: credential.authorizationCode,
      state,
      user: credential.fullName
        ? {
            name: {
              firstName: credential.fullName.givenName ?? undefined,
              lastName: credential.fullName.familyName ?? undefined,
            },
            email: credential.email ?? undefined,
          }
        : undefined,
    });
    await setTokens(tokens);
    setIsLoggedIn(true);
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = await getRefreshToken();
    if (refreshToken) {
      try {
        await postLogout(refreshToken);
      } catch {
        // 로그아웃 API 실패해도 로컬 토큰 삭제 진행
      }
    }
    await clearTokens();
    setIsLoggedIn(false);
  }, []);

  return (
    <AuthContext.Provider
      value={{ isLoggedIn, isLoading, loginWithKakao, loginWithNaver, loginWithApple, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth는 AuthProvider 내부에서만 사용 가능');
  return ctx;
}

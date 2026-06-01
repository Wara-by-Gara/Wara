import type { ExpoConfig } from 'expo/config';

const DEFAULT_DEV_API_URL = 'http://localhost:3000';

export default ({ config }: { config: ExpoConfig }): ExpoConfig => ({
  ...config,
  plugins: [
    ...(config.plugins ?? []),
    ['@react-native-kakao/core', { nativeAppKey: process.env.EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY ?? '' }],
    ['@react-native-google-signin/google-signin', { iosUrlScheme: process.env.GOOGLE_IOS_URL_SCHEME ?? '' }],
  ],
  extra: {
    ...config.extra,
    apiUrl: process.env.EXPO_PUBLIC_API_URL ?? DEFAULT_DEV_API_URL,
    kakaoMapKey: process.env.EXPO_PUBLIC_KAKAO_MAP_APP_KEY ?? '',
    naverClientId: process.env.EXPO_PUBLIC_NAVER_CLIENT_ID ?? '',
    naverClientSecret: process.env.EXPO_PUBLIC_NAVER_CLIENT_SECRET ?? '',
    googleWebClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '',
    googleIosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? '',
  },
});

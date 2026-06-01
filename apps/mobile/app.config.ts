import type { ExpoConfig } from 'expo/config';

const DEFAULT_DEV_API_URL = 'http://localhost:3000';

export default ({ config }: { config: ExpoConfig }): ExpoConfig => {
  const kakaoNativeKey = process.env.EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY;
  const googleIosScheme = process.env.GOOGLE_IOS_URL_SCHEME;

  const plugins = [...(config.plugins ?? [])];
  if (kakaoNativeKey) {
    plugins.push(['@react-native-kakao/core', { nativeAppKey: kakaoNativeKey }]);
  }
  if (googleIosScheme) {
    plugins.push(['@react-native-google-signin/google-signin', { iosUrlScheme: googleIosScheme }]);
  }

  return {
    ...config,
    plugins,
    extra: {
      ...config.extra,
      apiUrl: process.env.EXPO_PUBLIC_API_URL ?? DEFAULT_DEV_API_URL,
      kakaoMapKey: process.env.EXPO_PUBLIC_KAKAO_MAP_APP_KEY ?? '',
      naverClientId: process.env.EXPO_PUBLIC_NAVER_CLIENT_ID ?? '',
      naverClientSecret: process.env.EXPO_PUBLIC_NAVER_CLIENT_SECRET ?? '',
      googleWebClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '',
      googleIosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? '',
    },
  };
};

import type { ExpoConfig } from 'expo/config';

const DEFAULT_DEV_API_URL = 'http://localhost:3001';

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
  // Naver SDK: iOS Info.plist의 LSApplicationQueriesSchemes/CFBundleURLTypes + AppDelegate URL handler 자동 등록.
  // login.tsx의 serviceUrlSchemeIOS와 일치해야 함.
  plugins.push(['@react-native-seoul/naver-login', { urlScheme: 'wara' }]);
  // google-signin의 Swift static pod modular header 문제 해결 (use_modular_headers!)
  plugins.push('./plugins/with-modular-headers');
  // 사진 앨범 업로드 — 사진 라이브러리 접근 권한 문구.
  plugins.push([
    'expo-image-picker',
    { photosPermission: '모임 앨범에 사진을 올리기 위해 사진 접근 권한이 필요합니다.' },
  ]);
  // 푸시 알림 (in-app + Expo push). 실제 APNs 토큰은 실기기에서만 발급됨.
  plugins.push(['expo-notifications', {}]);

  return {
    ...config,
    plugins,
    extra: {
      ...config.extra,
      apiUrl: process.env.EXPO_PUBLIC_API_URL ?? DEFAULT_DEV_API_URL,
      kakaoMapKey: process.env.EXPO_PUBLIC_KAKAO_MAP_APP_KEY ?? '',
      kakaoNativeKey: process.env.EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY ?? '',
      naverClientId: process.env.EXPO_PUBLIC_NAVER_CLIENT_ID ?? '',
      naverClientSecret: process.env.EXPO_PUBLIC_NAVER_CLIENT_SECRET ?? '',
      googleWebClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '',
      googleIosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? '',
    },
  };
};

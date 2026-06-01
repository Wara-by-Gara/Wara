import type { ExpoConfig } from 'expo/config';

// app.json의 정적 설정을 그대로 사용하되, extra에 환경변수 주입을 위해
// app.config.ts로 전환. Expo는 app.json이 있으면 app.config.ts와 머지함.
//
// 환경변수:
// - EXPO_PUBLIC_API_URL: 와라 API base URL (예: https://api.wara.dev/api/v1)
//   .env / .env.development / EAS Secret 어느 쪽에서든 주입 가능.
//   dev 기본값은 로컬 api 서버. prod는 반드시 EAS Secret로 명시.

const DEFAULT_DEV_API_URL = 'http://localhost:3000/api/v1';

export default ({ config }: { config: ExpoConfig }): ExpoConfig => ({
  ...config,
  extra: {
    ...config.extra,
    apiUrl: process.env.EXPO_PUBLIC_API_URL ?? DEFAULT_DEV_API_URL,
    kakaoMapKey: process.env.EXPO_PUBLIC_KAKAO_MAP_APP_KEY ?? '',
  },
});

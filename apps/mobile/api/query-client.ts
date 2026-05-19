import { QueryClient } from '@tanstack/react-query';

import { WaraApiError } from './types';

/**
 * 와라 모바일 TanStack Query 기본 설정.
 *
 * - staleTime 30초: 화면 빠른 재진입 시 불필요한 refetch 회피
 * - 4xx(WaraApiError)는 retry 안 함 — 비즈니스 에러를 재시도해봐야 의미 없음
 * - 네트워크 오류(WaraNetworkError)·5xx만 최대 2회 재시도
 * - refetchOnWindowFocus는 RN 환경 무의미하므로 끔 (앱 포그라운드 복귀 시 refetch는 별도 hook으로)
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: false,
        retry: (failureCount, error) => {
          // 4xx 비즈니스 에러는 재시도 무의미 (validation 실패, 권한 등)
          if (error instanceof WaraApiError && error.status < 500) return false;
          // 5xx 서버 에러 + 네트워크 실패는 일시적일 수 있어 최대 2회 재시도
          return failureCount < 2;
        },
      },
      mutations: {
        retry: false,
      },
    },
  });
}

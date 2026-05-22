import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';

import { clearTokens } from './auth-storage';
import { WaraApiError } from './types';

/**
 * 와라 모바일 TanStack Query 기본 설정.
 *
 * - staleTime 30초: 화면 빠른 재진입 시 불필요한 refetch 회피
 * - 4xx(WaraApiError)는 retry 안 함 — 비즈니스 에러를 재시도해봐야 의미 없음
 * - 네트워크 오류(WaraNetworkError)·5xx만 최대 2회 재시도
 * - refetchOnWindowFocus는 켜둠 — RN의 window focus는 providers/query-provider.tsx의
 *   AppState 'active' 전환과 연동(focusManager) → 앱 포그라운드 복귀 시 stale query 자동 refetch
 * - 401 글로벌 핸들러: 토큰 만료/위조 시 SecureStore 비우기 → home에서 dev token form 노출
 *   (auth-kakao PR 도입 후엔 로그인 화면으로 자동 리다이렉트)
 */
export function createQueryClient(): QueryClient {
  const onAuthError = (error: unknown) => {
    if (error instanceof WaraApiError && error.status === 401) {
      // 토큰 폐기 — 호출 화면이 토큰 유무 query를 다시 평가하면서 자동 로그아웃 UI
      void clearTokens();
    }
  };

  return new QueryClient({
    queryCache: new QueryCache({ onError: onAuthError }),
    mutationCache: new MutationCache({ onError: onAuthError }),
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
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

import { useEffect } from 'react';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';

import { getAccessToken } from '@/api';

/** 토큰 유무 쿼리 키 — 로그인/로그아웃 직후 캐시를 갱신해야 가드가 새 상태를 본다. */
export const AUTH_QUERY_KEY = ['auth', 'access-token'] as const;

export function useAuthGuard() {
  const { data, isPending } = useQuery({
    queryKey: AUTH_QUERY_KEY,
    queryFn: getAccessToken,
    staleTime: 5_000,
  });

  useEffect(() => {
    if (isPending) return;
    if (!data) {
      router.replace('/login');
    }
  }, [data, isPending]);

  return { isReady: !isPending && !!data };
}

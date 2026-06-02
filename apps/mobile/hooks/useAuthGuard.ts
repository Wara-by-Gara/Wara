import { useEffect } from 'react';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';

import { getAccessToken } from '@/api';

const AUTH_KEY = ['auth', 'access-token'] as const;

export function useAuthGuard() {
  const { data, isPending } = useQuery({
    queryKey: AUTH_KEY,
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

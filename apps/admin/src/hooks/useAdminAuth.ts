'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { apiGet } from '@/lib/api/client';

interface Me {
  id: string;
  role: string;
}

export function useAdminAuth() {
  const router = useRouter();
  const { data, isLoading, isError, error } = useQuery<Me>({
    queryKey: ['me'],
    queryFn: () => apiGet<Me>('/users/me'),
    retry: false,
  });

  useEffect(() => {
    if (isLoading) return;
    if (isError) {
      const code = error instanceof Error ? error.message : '';
      if (code === 'TOKEN_EXPIRED' || code === 'TOKEN_INVALID') {
        router.push('/login');
      } else {
        router.push('/unauthorized');
      }
      return;
    }
    if (data && data.role !== 'admin') {
      router.push('/unauthorized');
    }
  }, [isLoading, isError, data, error, router]);

  return { isLoading, isAuthorized: !isLoading && !isError && data?.role === 'admin' };
}

import { QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';

import { createQueryClient } from '@/api/query-client';

/**
 * 앱 최상위에 두는 TanStack Query Provider.
 *
 * QueryClient를 `useState`로 초기화 → Fast Refresh 시에도 동일 인스턴스 유지
 * (모듈 최상위에 두면 hot reload 때 client가 재생성되어 캐시 손실).
 */
export function QueryProvider({ children }: { children: ReactNode }) {
  const [client] = useState(() => createQueryClient());
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

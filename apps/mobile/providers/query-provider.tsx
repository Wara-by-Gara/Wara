import { focusManager, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState, type ReactNode } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import { createQueryClient } from '@/api/query-client';

/**
 * 앱 최상위에 두는 TanStack Query Provider.
 *
 * - QueryClient를 `useState`로 초기화 → Fast Refresh 시에도 동일 인스턴스 유지
 *   (모듈 최상위에 두면 hot reload 때 client가 재생성되어 캐시 손실).
 * - AppState 'active' 전환 시 TanStack Query에 focus 알림 → stale query 자동 refetch.
 *   (web 환경의 refetchOnWindowFocus의 RN 등가물)
 */
export function QueryProvider({ children }: { children: ReactNode }) {
  const [client] = useState(() => createQueryClient());

  useEffect(() => {
    const onChange = (status: AppStateStatus) => {
      focusManager.setFocused(status === 'active');
    };
    const subscription = AppState.addEventListener('change', onChange);
    return () => subscription.remove();
  }, []);

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

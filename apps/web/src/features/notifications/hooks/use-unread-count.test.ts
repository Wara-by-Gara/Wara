import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';
import { server } from '@/mocks/server';
import { http, HttpResponse } from 'msw';
import { useUnreadCount } from './use-unread-count';

function wrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return createElement(QueryClientProvider, { client: queryClient }, children);
}

describe('useUnreadCount', () => {
  it('미읽은 알림 수를 반환한다', async () => {
    const { result } = renderHook(() => useUnreadCount(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({ count: 3 });
  });

  it('refetch 시 최신 데이터로 갱신된다', async () => {
    server.use(
      http.get('http://localhost:3000/api/v1/notifications/unread', () =>
        HttpResponse.json({
          success: true,
          data: { count: 10 },
          meta: { requestId: 'test', timestamp: new Date().toISOString() },
        }),
      ),
    );

    const { result } = renderHook(() => useUnreadCount(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    await result.current.refetch();
    await waitFor(() => expect(result.current.data).toEqual({ count: 10 }));
  });
});

import { describe, it, expect, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';
import { server } from '@/mocks/server';
import { http, HttpResponse } from 'msw';
import { mockSettings } from '@/mocks/handlers';
import {
  useUnreadCount,
  useNotifications,
  useMarkAsRead,
  useMarkAllAsRead,
  useNotificationSettings,
  useUpdateNotificationSettings,
  notificationKeys,
} from './useNotifications';

const BASE = 'http://localhost:3001/api';

function wrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return createElement(QueryClientProvider, { client: queryClient }, children);
}

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  function w({ children }: { children: React.ReactNode }) {
    return createElement(
      QueryClientProvider,
      { client: queryClient },
      children,
    );
  }
  return { wrapper: w, queryClient };
}

function wrap<T>(data: T) {
  return {
    success: true,
    data,
    meta: { requestId: 'test', timestamp: '2026-05-20T10:00:00.000Z' },
  };
}

describe('useUnreadCount', () => {
  it('미읽은 알림 수를 반환한다', async () => {
    const { result } = renderHook(() => useUnreadCount(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({ count: 3 });
  });

  it('refetch 시 최신 데이터로 갱신된다', async () => {
  server.use(
    http.get(`http://localhost:3001/api/notifications/unread`, () =>
      HttpResponse.json(wrap({ count: 10 })),
    ),
  );
  const { wrapper: w } = makeWrapper();  // ← wrapper → makeWrapper()
  const { result } = renderHook(() => useUnreadCount(), { wrapper: w });
  await waitFor(() => expect(result.current.isSuccess).toBe(true));
  await result.current.refetch();
  await waitFor(() => expect(result.current.data).toEqual({ count: 10 }));
});
});

describe('useNotifications', () => {
  it('첫 페이지 알림 목록을 반환한다', async () => {
    const { result } = renderHook(() => useNotifications(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.pages[0]?.items).toHaveLength(4);
  });

  it('nextCursor가 null이면 hasNextPage가 false다', async () => {
    const { result } = renderHook(() => useNotifications(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.hasNextPage).toBe(false);
  });

  it('nextCursor가 있으면 hasNextPage가 true다', async () => {
    server.use(
      http.get(`${BASE}/notifications`, () =>
        HttpResponse.json(
          wrap({ items: [], nextCursor: 'next-cursor', hasNext: true }),
        ),
      ),
    );
    const { result } = renderHook(() => useNotifications(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.hasNextPage).toBe(true);
  });
});

describe('useMarkAsRead', () => {
  it('성공 시 lists, unread 캐시를 무효화한다', async () => {
    const { wrapper: w, queryClient } = makeWrapper();
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useMarkAsRead(), { wrapper: w });

    act(() => {
      result.current.mutate('n1');
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(invalidate).toHaveBeenCalledWith({
      queryKey: notificationKeys.lists(),
    });
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: notificationKeys.unread(),
    });
  });

  it('읽음 처리된 알림을 반환한다', async () => {
    const { wrapper: w } = makeWrapper();
    const { result } = renderHook(() => useMarkAsRead(), { wrapper: w });

    act(() => {
      result.current.mutate('n1');
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.isRead).toBe(true);
    expect(result.current.data?.id).toBe('n1');
  });
});

describe('useMarkAllAsRead', () => {
  it('성공 시 lists, unread 캐시를 무효화한다', async () => {
    const { wrapper: w, queryClient } = makeWrapper();
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useMarkAllAsRead(), { wrapper: w });

    act(() => {
      result.current.mutate();
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(invalidate).toHaveBeenCalledWith({
      queryKey: notificationKeys.lists(),
    });
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: notificationKeys.unread(),
    });
  });
});

describe('useNotificationSettings', () => {
  it('알림 설정을 반환한다', async () => {
    const { wrapper: w } = makeWrapper();
    const { result } = renderHook(() => useNotificationSettings(), {
      wrapper: w,
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.id).toBe('s1');
    expect(result.current.data?.isFeedback).toBe(true);
  });
});

describe('useUpdateNotificationSettings', () => {
  it('성공 시 settings 캐시를 업데이트된 값으로 교체한다', async () => {
    server.use(
      http.patch(`${BASE}/notifications/settings`, async () =>
        HttpResponse.json(wrap({ ...mockSettings, isFeedback: false })),
      ),
    );
    const { wrapper: w, queryClient } = makeWrapper();
    const setQueryData = vi.spyOn(queryClient, 'setQueryData');
    const { result } = renderHook(() => useUpdateNotificationSettings(), {
      wrapper: w,
    });

    act(() => {
      result.current.mutate({ isFeedback: false });
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(setQueryData).toHaveBeenCalledWith(
      notificationKeys.settings(),
      expect.objectContaining({ isFeedback: false }),
    );
  });

  it('성공 시 반환된 값을 캐시에 설정한다', async () => {
    server.use(
      http.patch(`${BASE}/notifications/settings`, async () =>
        HttpResponse.json(wrap({ ...mockSettings, isPhoto: false })),
      ),
    );
    const { wrapper: w } = makeWrapper();
    const { result } = renderHook(() => useUpdateNotificationSettings(), {
      wrapper: w,
    });

    act(() => {
      result.current.mutate({ isPhoto: false });
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.isPhoto).toBe(false);
  });
});

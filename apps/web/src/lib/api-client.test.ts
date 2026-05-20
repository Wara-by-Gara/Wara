import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiClient } from './api-client';

const BASE = 'http://localhost:3000/api/v1';

function makeFetchResponse(body: unknown, status = 200) {
  return Promise.resolve({
    status,
    json: () => Promise.resolve(body),
  } as Response);
}

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn());
});

describe('apiClient', () => {
  it('성공 응답에서 data를 반환한다', async () => {
    vi.mocked(fetch).mockReturnValueOnce(
      makeFetchResponse({ success: true, data: { count: 5 }, meta: {} }),
    );

    const result = await apiClient<{ count: number }>('/notifications/unread');
    expect(result).toEqual({ count: 5 });
  });

  it('204 No Content에서 undefined를 반환한다', async () => {
    vi.mocked(fetch).mockReturnValueOnce(
      Promise.resolve({ status: 204 } as Response),
    );

    const result = await apiClient('/notifications/readAll', { method: 'PATCH' });
    expect(result).toBeUndefined();
  });

  it('success: false 응답에서 ApiError를 throw한다', async () => {
    vi.mocked(fetch).mockReturnValueOnce(
      makeFetchResponse({
        success: false,
        error: {
          code: 'NOTIFICATION_NOT_FOUND',
          type: 'not_found',
          message: 'NOTIFICATION_NOT_FOUND',
        },
        meta: {},
      }),
    );

    await expect(apiClient('/notifications/x')).rejects.toMatchObject({
      name: 'ApiError',
      code: 'NOTIFICATION_NOT_FOUND',
      type: 'not_found',
    });
  });

  it('ApiError는 details를 포함한다', async () => {
    vi.mocked(fetch).mockReturnValueOnce(
      makeFetchResponse({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          type: 'invalid_request',
          message: 'VALIDATION_ERROR',
          details: { field: 'content' },
        },
        meta: {},
      }),
    );

    await expect(apiClient('/notifications')).rejects.toMatchObject({
      details: { field: 'content' },
    });
  });

  it(`fetch URL에 BASE_URL + /api/v1 프리픽스가 포함된다`, async () => {
    vi.mocked(fetch).mockReturnValueOnce(
      makeFetchResponse({ success: true, data: null, meta: {} }),
    );

    await apiClient('/notifications');
    expect(fetch).toHaveBeenCalledWith(
      `${BASE}/notifications`,
      expect.any(Object),
    );
  });

  it('fetch 호출 시 credentials: include가 포함된다', async () => {
    vi.mocked(fetch).mockReturnValueOnce(
      makeFetchResponse({ success: true, data: null, meta: {} }),
    );

    await apiClient('/notifications');
    expect(fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ credentials: 'include' }),
    );
  });
});

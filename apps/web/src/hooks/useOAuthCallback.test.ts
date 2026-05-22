import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useOAuthCallback } from './useOAuthCallback';

const mockReplace = vi.fn();
const mockGetParam = vi.fn();
const mockLogin = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mockReplace }),
  usePathname: () => '/invitations/create',
  useSearchParams: () => ({ get: mockGetParam }),
}));

vi.mock('@/stores/authStore', () => ({
  useAuthStore: vi.fn((selector: (s: { login: typeof mockLogin }) => unknown) =>
    selector({ login: mockLogin }),
  ),
}));

beforeEach(() => {
  mockReplace.mockClear();
  mockGetParam.mockClear();
  mockLogin.mockClear();
});

describe('useOAuthCallback', () => {
  it('쿼리 파라미터가 없으면 login과 replace를 호출하지 않는다', () => {
    mockGetParam.mockReturnValue(null);
    renderHook(() => useOAuthCallback());
    expect(mockLogin).not.toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('access_token만 있으면 login을 호출하지 않는다', () => {
    mockGetParam.mockImplementation((key: string) =>
      key === 'access_token' ? 'at123' : null,
    );
    renderHook(() => useOAuthCallback());
    expect(mockLogin).not.toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('access_token과 refresh_token이 모두 있으면 login을 호출한다', () => {
    mockGetParam.mockImplementation((key: string) => {
      if (key === 'access_token') return 'at123';
      if (key === 'refresh_token') return 'rt456';
      return null;
    });
    renderHook(() => useOAuthCallback());
    expect(mockLogin).toHaveBeenCalledWith('at123', 'rt456');
  });

  it('토큰 처리 후 pathname으로 URL을 클린업한다', () => {
    mockGetParam.mockImplementation((key: string) => {
      if (key === 'access_token') return 'at123';
      if (key === 'refresh_token') return 'rt456';
      return null;
    });
    renderHook(() => useOAuthCallback());
    expect(mockReplace).toHaveBeenCalledWith('/invitations/create');
  });
});

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
  sessionStorage.clear();
  localStorage.clear();
});

describe('useOAuthCallback', () => {
  it('쿼리 파라미터가 없으면 login과 replace를 호출하지 않는다', () => {
    mockGetParam.mockReturnValue(null);
    renderHook(() => useOAuthCallback());
    expect(mockLogin).not.toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('auth_success=1이 아니면 login을 호출하지 않는다', () => {
    mockGetParam.mockImplementation((key: string) =>
      key === 'auth_error' ? '1' : null,
    );
    renderHook(() => useOAuthCallback());
    expect(mockLogin).not.toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('auth_success=1이면 login을 호출한다', () => {
    mockGetParam.mockImplementation((key: string) =>
      key === 'auth_success' ? '1' : null,
    );
    renderHook(() => useOAuthCallback());
    expect(mockLogin).toHaveBeenCalledWith();
  });

  it('온보딩 미완료 시 /onboarding으로 이동한다', () => {
    mockGetParam.mockImplementation((key: string) =>
      key === 'auth_success' ? '1' : null,
    );
    renderHook(() => useOAuthCallback());
    expect(mockReplace).toHaveBeenCalledWith('/onboarding');
  });

  it('온보딩 완료 시 returnTo로 이동한다', () => {
    localStorage.setItem('wara_onboarding_done', '1');
    sessionStorage.setItem('wara_oauth_return', '/invitations/create');
    mockGetParam.mockImplementation((key: string) =>
      key === 'auth_success' ? '1' : null,
    );
    renderHook(() => useOAuthCallback());
    expect(mockReplace).toHaveBeenCalledWith('/invitations/create');
  });
});

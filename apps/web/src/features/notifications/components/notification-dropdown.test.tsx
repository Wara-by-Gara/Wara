import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test-utils';
import { NotificationDropdown } from './notification-dropdown';
import type { Notification } from '../types';

vi.mock('../hooks/use-notifications');
vi.mock('../hooks/use-notification-socket', () => ({
  useNotificationSocket: vi.fn(),
}));

const { useNotifications } = await import('../hooks/use-notifications');

const makeNotification = (id: string, isRead = false): Notification => ({
  id,
  userId: 'u1',
  actorUserId: 'a1',
  type: 'feedback',
  content: `알림 ${id}`,
  targetType: 'feedback',
  targetId: 't1',
  isRead,
  readAt: null,
  createdAt: '2026-05-20T10:00:00.000Z',
});

function mockUseNotifications(overrides: Partial<ReturnType<typeof useNotifications>>) {
  vi.mocked(useNotifications).mockReturnValue({
    data: undefined,
    fetchNextPage: vi.fn(),
    hasNextPage: false,
    isFetchingNextPage: false,
    isLoading: false,
    ...overrides,
  } as ReturnType<typeof useNotifications>);
}

describe('NotificationDropdown', () => {
  it('로딩 중일 때 로딩 텍스트를 표시한다', () => {
    mockUseNotifications({ isLoading: true });
    renderWithProviders(<NotificationDropdown onOpenSettings={vi.fn()} />);
    expect(screen.getByText('로딩 중...')).toBeInTheDocument();
  });

  it('알림이 없을 때 빈 상태 메시지를 표시한다', () => {
    mockUseNotifications({ isLoading: false });
    renderWithProviders(<NotificationDropdown onOpenSettings={vi.fn()} />);
    expect(screen.getByText('알림이 없어요')).toBeInTheDocument();
  });

  it('알림 목록을 렌더링한다', () => {
    mockUseNotifications({
      data: { pages: [{ items: [makeNotification('n1'), makeNotification('n2')], nextCursor: null, hasNext: false }], pageParams: [] },
    });
    renderWithProviders(<NotificationDropdown onOpenSettings={vi.fn()} />);
    expect(screen.getByText('알림 n1')).toBeInTheDocument();
    expect(screen.getByText('알림 n2')).toBeInTheDocument();
  });

  it('다음 페이지가 있으면 더 보기 버튼을 표시한다', () => {
    mockUseNotifications({
      data: { pages: [{ items: [makeNotification('n1')], nextCursor: 'n1', hasNext: true }], pageParams: [] },
      hasNextPage: true,
    });
    renderWithProviders(<NotificationDropdown onOpenSettings={vi.fn()} />);
    expect(screen.getByRole('button', { name: '더 보기' })).toBeInTheDocument();
  });

  it('다음 페이지가 없으면 더 보기 버튼이 없다', () => {
    mockUseNotifications({
      data: { pages: [{ items: [makeNotification('n1')], nextCursor: null, hasNext: false }], pageParams: [] },
      hasNextPage: false,
    });
    renderWithProviders(<NotificationDropdown onOpenSettings={vi.fn()} />);
    expect(screen.queryByRole('button', { name: '더 보기' })).not.toBeInTheDocument();
  });

  it('설정 버튼 클릭 시 onOpenSettings가 호출된다', async () => {
    mockUseNotifications({ isLoading: false });
    const onOpenSettings = vi.fn();
    renderWithProviders(<NotificationDropdown onOpenSettings={onOpenSettings} />);
    await userEvent.click(screen.getByRole('button', { name: '설정' }));
    expect(onOpenSettings).toHaveBeenCalledOnce();
  });
});

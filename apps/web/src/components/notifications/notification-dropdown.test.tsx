import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NotificationDropdown } from './notification-dropdown';
import type { Notification } from '@/lib/api/notifications';

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

const defaultProps = {
  notifications: [],
  isLoading: false,
  hasNextPage: false,
  isFetchingNextPage: false,
  isMarkingAllRead: false,
  onMarkAsRead: vi.fn(),
  onMarkAllAsRead: vi.fn(),
  onLoadMore: vi.fn(),
  onOpenSettings: vi.fn(),
};

describe('NotificationDropdown', () => {
  it('isLoading일 때 로딩 텍스트를 표시한다', () => {
    render(<NotificationDropdown {...defaultProps} isLoading={true} />);
    expect(screen.getByText('로딩 중...')).toBeInTheDocument();
  });

  it('알림이 없을 때 빈 상태 메시지를 표시한다', () => {
    render(<NotificationDropdown {...defaultProps} />);
    expect(screen.getByText('알림이 없어요')).toBeInTheDocument();
  });

  it('알림 목록을 렌더링한다', () => {
    render(
      <NotificationDropdown
        {...defaultProps}
        notifications={[makeNotification('n1'), makeNotification('n2')]}
      />,
    );
    expect(screen.getByText('알림 n1')).toBeInTheDocument();
    expect(screen.getByText('알림 n2')).toBeInTheDocument();
  });

  it('hasNextPage가 true이면 더 보기 버튼을 표시한다', () => {
    render(
      <NotificationDropdown
        {...defaultProps}
        notifications={[makeNotification('n1')]}
        hasNextPage={true}
      />,
    );
    expect(screen.getByRole('button', { name: '더 보기' })).toBeInTheDocument();
  });

  it('hasNextPage가 false이면 더 보기 버튼이 없다', () => {
    render(
      <NotificationDropdown
        {...defaultProps}
        notifications={[makeNotification('n1')]}
        hasNextPage={false}
      />,
    );
    expect(screen.queryByRole('button', { name: '더 보기' })).not.toBeInTheDocument();
  });

  it('설정 버튼 클릭 시 onOpenSettings가 호출된다', async () => {
    const onOpenSettings = vi.fn();
    render(<NotificationDropdown {...defaultProps} onOpenSettings={onOpenSettings} />);
    await userEvent.click(screen.getByRole('button', { name: '설정' }));
    expect(onOpenSettings).toHaveBeenCalledOnce();
  });

  it('모두 읽음 클릭 시 onMarkAllAsRead가 호출된다', async () => {
    const onMarkAllAsRead = vi.fn();
    render(<NotificationDropdown {...defaultProps} onMarkAllAsRead={onMarkAllAsRead} />);
    await userEvent.click(screen.getByRole('button', { name: '모두 읽음' }));
    expect(onMarkAllAsRead).toHaveBeenCalledOnce();
  });
});

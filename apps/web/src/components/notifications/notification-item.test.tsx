import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NotificationItem } from './notification-item';
import type { Notification } from '@/lib/api/notifications';

const base: Notification = {
  id: 'n1',
  userId: 'u1',
  actorUserId: 'a1',
  type: 'feedback',
  content: '새 피드백이 도착했어요',
  targetType: 'feedback',
  targetId: 't1',
  isRead: false,
  readAt: null,
  createdAt: '2026-05-20T10:00:00.000Z',
};

describe('NotificationItem', () => {
  it('알림 내용을 렌더링한다', () => {
    render(
      <NotificationItem
        notification={base}
        onReadAction={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByText('새 피드백이 도착했어요')).toBeInTheDocument();
  });

  it('알림 타입 레이블을 렌더링한다', () => {
    render(
      <NotificationItem
        notification={base}
        onReadAction={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByText('피드백')).toBeInTheDocument();
  });

  it('읽지 않은 알림에 파란 점이 표시된다', () => {
    const { container } = render(
      <NotificationItem
        notification={base}
        onReadAction={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(container.querySelector('.bg-primary')).toBeInTheDocument();
  });

  it('이미 읽은 알림에 파란 점이 없다', () => {
    const { container } = render(
      <NotificationItem
        notification={{
          ...base,
          isRead: true,
          readAt: '2026-05-20T11:00:00.000Z',
        }}
        onReadAction={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(container.querySelector('.bg-primary')).not.toBeInTheDocument();
  });

  it('읽지 않은 알림 클릭 시 onRead가 id와 함께 호출된다', async () => {
    const onRead = vi.fn();
    render(
      <NotificationItem
        notification={base}
        onReadAction={onRead}
        onDelete={vi.fn()}
      />,
    );
    const buttons = screen.getAllByRole('button');
    await userEvent.click(buttons[0]!);
    expect(onRead).toHaveBeenCalledWith('n1');
  });

  it('이미 읽은 알림 클릭 시 onRead가 호출되지 않는다', async () => {
    const onRead = vi.fn();
    render(
      <NotificationItem
        notification={{
          ...base,
          isRead: true,
          readAt: '2026-05-20T11:00:00.000Z',
        }}
        onReadAction={onRead}
        onDelete={vi.fn()}
      />,
    );
    const buttons = screen.getAllByRole('button');
    await userEvent.click(buttons[0]!);
    expect(onRead).not.toHaveBeenCalled();
  });
});

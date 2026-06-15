import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NotificationBell } from './notification-bell';

describe('NotificationBell', () => {
  it('unreadCount가 0이면 읽지 않음 표시(빨간 점)가 없다', () => {
    render(<NotificationBell unreadCount={0} onClick={vi.fn()} />);
    expect(screen.getByRole('button', { name: '알림' })).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /읽지 않은 알림/ }),
    ).not.toBeInTheDocument();
  });

  it('unreadCount가 1 이상이면 읽지 않음 표시(빨간 점)가 있다', () => {
    render(<NotificationBell unreadCount={5} onClick={vi.fn()} />);
    expect(
      screen.getByRole('button', { name: /읽지 않은 알림/ }),
    ).toBeInTheDocument();
  });

  it('클릭 시 onClick이 호출된다', async () => {
    const onClick = vi.fn();
    render(<NotificationBell unreadCount={0} onClick={onClick} />);
    await userEvent.click(screen.getByRole('button', { name: '알림' }));
    expect(onClick).toHaveBeenCalledOnce();
  });
});

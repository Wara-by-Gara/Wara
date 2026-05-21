import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NotificationBell } from './notification-bell';

describe('NotificationBell', () => {
  it('unreadCount가 0이면 뱃지가 없다', () => {
    render(<NotificationBell unreadCount={0} onClick={vi.fn()} />);
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  it('unreadCount가 5이면 뱃지에 5가 표시된다', () => {
    render(<NotificationBell unreadCount={5} onClick={vi.fn()} />);
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('unreadCount가 100이면 뱃지에 99+가 표시된다', () => {
    render(<NotificationBell unreadCount={100} onClick={vi.fn()} />);
    expect(screen.getByText('99+')).toBeInTheDocument();
  });

  it('클릭 시 onClick이 호출된다', async () => {
    const onClick = vi.fn();
    render(<NotificationBell unreadCount={0} onClick={onClick} />);
    await userEvent.click(screen.getByRole('button', { name: '알림' }));
    expect(onClick).toHaveBeenCalledOnce();
  });
});

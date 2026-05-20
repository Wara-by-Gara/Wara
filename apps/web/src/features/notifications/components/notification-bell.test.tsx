import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test-utils';
import { NotificationBell } from './notification-bell';

vi.mock('../hooks/use-unread-count');
vi.mock('../hooks/use-notification-socket', () => ({
  useNotificationSocket: vi.fn(),
}));
vi.mock('../hooks/use-notifications');
vi.mock('./notification-dropdown', () => ({
  NotificationDropdown: ({ onOpenSettings }: { onOpenSettings: () => void }) => (
    <div data-testid="dropdown">
      <button onClick={onOpenSettings}>설정</button>
    </div>
  ),
}));

const { useUnreadCount } = await import('../hooks/use-unread-count');

function mockCount(count: number) {
  vi.mocked(useUnreadCount).mockReturnValue({
    data: { count },
  } as ReturnType<typeof useUnreadCount>);
}

describe('NotificationBell', () => {
  it('unread가 0이면 뱃지가 없다', () => {
    mockCount(0);
    renderWithProviders(<NotificationBell />);
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  it('unread가 5이면 뱃지에 5가 표시된다', () => {
    mockCount(5);
    renderWithProviders(<NotificationBell />);
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('unread가 100이면 뱃지에 99+가 표시된다', () => {
    mockCount(100);
    renderWithProviders(<NotificationBell />);
    expect(screen.getByText('99+')).toBeInTheDocument();
  });

  it('벨 클릭 시 드롭다운이 열린다', async () => {
    mockCount(0);
    renderWithProviders(<NotificationBell />);
    expect(screen.queryByTestId('dropdown')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: '알림' }));
    expect(screen.getByTestId('dropdown')).toBeInTheDocument();
  });

  it('벨 재클릭 시 드롭다운이 닫힌다', async () => {
    mockCount(0);
    renderWithProviders(<NotificationBell />);
    await userEvent.click(screen.getByRole('button', { name: '알림' }));
    await userEvent.click(screen.getByRole('button', { name: '알림' }));
    expect(screen.queryByTestId('dropdown')).not.toBeInTheDocument();
  });

  it('외부 클릭 시 드롭다운이 닫힌다', async () => {
    mockCount(0);
    renderWithProviders(
      <div>
        <NotificationBell />
        <div data-testid="outside">outside</div>
      </div>,
    );
    await userEvent.click(screen.getByRole('button', { name: '알림' }));
    expect(screen.getByTestId('dropdown')).toBeInTheDocument();
    await userEvent.click(screen.getByTestId('outside'));
    expect(screen.queryByTestId('dropdown')).not.toBeInTheDocument();
  });

  it('드롭다운 설정 버튼 클릭 시 설정 시트가 열린다', async () => {
    mockCount(0);
    renderWithProviders(<NotificationBell />);
    await userEvent.click(screen.getByRole('button', { name: '알림' }));
    await userEvent.click(screen.getByRole('button', { name: '설정' }));
    expect(screen.getByText('알림 설정')).toBeInTheDocument();
  });
});

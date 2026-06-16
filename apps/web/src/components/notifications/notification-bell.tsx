'use client';

import { Icon } from '@/components/icons';

interface Props {
  unreadCount: number;
  onClick: () => void;
}

export function NotificationBell({ unreadCount, onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={unreadCount > 0 ? '알림, 읽지 않은 알림 있음' : '알림'}
      className="relative inline-flex size-11 items-center justify-center rounded-md text-text-muted hover:bg-gray-100 transition-colors duration-150"
    >
      <Icon name="bell" size="lg" color="currentColor" decorative />
      {unreadCount > 0 && (
        <span className="absolute top-2 right-2 size-2 bg-red-500 rounded-full" />
      )}
    </button>
  );
}

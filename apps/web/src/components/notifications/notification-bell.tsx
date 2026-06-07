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
      aria-label="알림"
      className="relative inline-flex size-11 items-center justify-center rounded-md text-text-secondary hover:bg-gray-100 transition-colors duration-150"
    >
      <Icon name="bell" size="lg" color="currentColor" decorative />
      {unreadCount > 0 && (
        <span className="absolute top-1.5 right-1.5 min-w-4 h-4 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center px-0.5 leading-none">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </button>
  );
}

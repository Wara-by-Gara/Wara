'use client';

import { NotificationItem } from './notification-item';
import type { Notification } from '@/lib/api/notifications';

interface Props {
  notifications: Notification[];
  isLoading: boolean;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  isMarkingAllRead: boolean;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onLoadMore: () => void;
  onOpenSettings: () => void;
}

export function NotificationDropdown({
  notifications,
  isLoading,
  hasNextPage,
  isFetchingNextPage,
  isMarkingAllRead,
  onMarkAsRead,
  onMarkAllAsRead,
  onLoadMore,
  onOpenSettings,
}: Props) {
  return (
    <div className="absolute right-0 top-full mt-2 w-80 bg-surface rounded-2xl shadow-lg border border-border overflow-hidden z-50">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <span className="text-sm font-semibold text-text-primary">알림</span>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onMarkAllAsRead}
            disabled={isMarkingAllRead}
            className="text-xs text-primary hover:opacity-70 disabled:opacity-40 transition-opacity"
          >
            모두 읽음
          </button>
          <button
            type="button"
            onClick={onOpenSettings}
            className="text-xs text-text-tertiary hover:text-text-secondary transition-colors"
          >
            설정
          </button>
        </div>
      </div>

      <div className="max-h-96 overflow-y-auto divide-y divide-border">
        {isLoading && (
          <div className="py-8 text-center text-sm text-text-tertiary">
            로딩 중...
          </div>
        )}
        {!isLoading && notifications.length === 0 && (
          <div className="py-8 text-center text-sm text-text-tertiary">
            알림이 없어요
          </div>
        )}
        {notifications.map((n) => (
          <NotificationItem key={n.id} notification={n} onReadAction={onMarkAsRead} />
        ))}
        {hasNextPage && (
          <button
            type="button"
            onClick={onLoadMore}
            disabled={isFetchingNextPage}
            className="w-full py-3 text-sm text-text-tertiary hover:text-text-secondary disabled:opacity-50 transition-colors"
          >
            {isFetchingNextPage ? '로딩 중...' : '더 보기'}
          </button>
        )}
      </div>
    </div>
  );
}

'use client';

import { useNotifications, useMarkAsRead, useMarkAllAsRead } from '@/hooks/useNotifications';
import { NotificationItem } from './notification-item';

interface Props {
  onOpenSettings: () => void;
}

export function NotificationDropdown({ onOpenSettings }: Props) {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useNotifications();
  const { mutate: markAsRead } = useMarkAsRead();
  const { mutate: markAllAsRead, isPending: isMarkingAllRead } = useMarkAllAsRead();

  const notifications = data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-50">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <span className="text-sm font-semibold">알림</span>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => markAllAsRead()}
            disabled={isMarkingAllRead}
            className="text-xs text-blue-500 hover:text-blue-600 disabled:opacity-50"
          >
            모두 읽음
          </button>
          <button
            type="button"
            onClick={onOpenSettings}
            className="text-xs text-gray-400 hover:text-gray-600"
          >
            설정
          </button>
        </div>
      </div>

      <div className="max-h-96 overflow-y-auto divide-y divide-gray-50">
        {isLoading && (
          <div className="py-8 text-center text-sm text-gray-400">
            로딩 중...
          </div>
        )}
        {!isLoading && notifications.length === 0 && (
          <div className="py-8 text-center text-sm text-gray-400">
            알림이 없어요
          </div>
        )}
        {notifications.map((n) => (
          <NotificationItem
            key={n.id}
            notification={n}
            onRead={(id) => markAsRead(id)}
          />
        ))}
        {hasNextPage && (
          <button
            type="button"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="w-full py-3 text-sm text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            {isFetchingNextPage ? '로딩 중...' : '더 보기'}
          </button>
        )}
      </div>
    </div>
  );
}

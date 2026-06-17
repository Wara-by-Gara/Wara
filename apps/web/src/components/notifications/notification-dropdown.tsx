'use client';

import { useEffect, useRef } from 'react';
import { LoadMoreSkeleton, NotificationListSkeleton } from '@/components/domain/Skeleton';
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
  onDelete: (id: string) => void;
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
  onDelete,
  onLoadMore,
  onOpenSettings,
}: Props) {
  // sentinel(더 보기 버튼)이 화면에 들어오면 다음 페이지 자동 로드.
  // 버튼은 클릭 가능한 fallback도 겸함.
  const sentinelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage) return;
    const node = sentinelRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) onLoadMore();
      },
      { threshold: 0.1 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, onLoadMore]);

  return (
    <div className="absolute right-0 top-full mt-2 w-80 bg-surface rounded-md shadow-lg border border-border overflow-hidden z-50">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <span className="text-sm font-semibold text-text">알림</span>
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
            className="text-xs text-text-disabled hover:text-text-muted transition-colors"
          >
            설정
          </button>
        </div>
      </div>

      <div className="max-h-96 overflow-y-auto divide-y divide-border">
        {isLoading && <NotificationListSkeleton count={5} />}
        {!isLoading && notifications.length === 0 && (
          <div className="py-8 text-center text-sm text-text-disabled">
            알림이 없어요
          </div>
        )}
        {notifications.map((n) => (
          <NotificationItem
            key={n.id}
            notification={n}
            onReadAction={onMarkAsRead}
            onDelete={onDelete}
          />
        ))}
        {hasNextPage && (
          <>
            <button
              ref={sentinelRef}
              type="button"
              onClick={onLoadMore}
              disabled={isFetchingNextPage}
              className="w-full py-3 text-sm text-text-disabled hover:text-text-muted disabled:opacity-50 transition-colors"
            >
              더 보기
            </button>
            {isFetchingNextPage ? <LoadMoreSkeleton /> : null}
          </>
        )}
      </div>
    </div>
  );
}

'use client';

import { Icon } from '@/components/icons';
import { Chip } from '@/components/primitives/Chip';
import { Button } from '@/components/primitives/Button';
import { Switch } from '@/components/primitives/Switch';
import { TopAppBar } from '@/components/molecules/TopAppBar';
import { MainBottomNav } from '@/components/layout/MainBottomNav';
import { MenuItem } from '@/components/molecules/MenuItem';
import { ConfirmModal } from '@/components/molecules/Modal';
import {
  NotificationItem,
  type NotificationType,
} from '@/components/organisms/NotificationItem';
import { NotificationListSkeleton } from '@/components/organisms/Skeleton';
import { EmptyState } from '@/components/organisms/EmptyState';
import { ErrorState } from '@/components/organisms/ErrorState';
import { mockNotifications } from '@/lib/mockData';
import { mobileMainCenter, mobileMainScroll } from '@/lib/mobilePageLayout';
import { cn } from '@/lib/cn';

export type NotificationsState =
  | 'default'
  | 'empty'
  | 'loading'
  | 'error'
  | 'unreadOnly'
  | 'dateGrouped'
  | 'markAllReadModal'
  | 'settings'
  | 'pushPermissionGuide'
  | 'pushDisabledGuide';

export type NotificationListItem = {
  id: string;
  type: string;
  title: string;
  description?: string;
  time: string;
  unread?: boolean;
};

export interface NotificationsProps {
  state?: NotificationsState;
  items?: NotificationListItem[];
  onBack?: () => void;
  onMarkAllAsRead?: () => void;
  onMarkAsRead?: (id: string) => void;
  onFilterChange?: (filter: 'all' | 'unread') => void;
  onRetry?: () => void;
  onSettings?: () => void;
  isMarkingAllRead?: boolean;
}

export const Notifications = ({
  state = 'default',
  items = mockNotifications,
  onBack,
  onMarkAllAsRead,
  onMarkAsRead,
  onFilterChange,
  onRetry,
  onSettings,
}: NotificationsProps) => {
  if (state === 'settings') {
    return (
      <div className="relative mx-auto flex h-full min-h-full w-full max-w-md flex-col overflow-x-hidden bg-background-soft">
        <TopAppBar className="shrink-0" title="알림 설정" onBack={onBack} />
        <main className="min-h-0 flex-1 overflow-y-auto">
          <section className="py-2">
            <div className="divide-y divide-border bg-surface">
              <MenuItem leftIcon="bell" rightSlot={<Switch defaultChecked />}>
                푸시 알림
              </MenuItem>
              <MenuItem
                leftIcon="user-check"
                rightSlot={<Switch defaultChecked />}
              >
                새 RSVP
              </MenuItem>
              <MenuItem
                leftIcon="message-circle"
                rightSlot={<Switch defaultChecked />}
              >
                새 댓글
              </MenuItem>
              <MenuItem leftIcon="image" rightSlot={<Switch />}>
                새 사진
              </MenuItem>
              <MenuItem
                leftIcon="calendar-clock"
                rightSlot={<Switch defaultChecked />}
              >
                모임 리마인더
              </MenuItem>
            </div>
          </section>
        </main>
        <MainBottomNav activeKey="notifications" />
      </div>
    );
  }

  if (state === 'pushPermissionGuide' || state === 'pushDisabledGuide') {
    return (
      <div className="relative mx-auto flex h-full min-h-full w-full max-w-md flex-col overflow-x-hidden bg-background">
        <TopAppBar className="shrink-0" title="알림" onBack={onBack} />
        <main className={mobileMainCenter}>
          <EmptyState
            icon="bell"
            title={
              state === 'pushPermissionGuide'
                ? '알림을 받으시겠어요?'
                : '알림 권한이 꺼져있어요'
            }
            description={
              state === 'pushPermissionGuide'
                ? 'RSVP·댓글·사진 알림을 보내드릴게요'
                : '설정에서 알림을 켜면 새 소식을 받을 수 있어요'
            }
            action={
              <Button>
                {state === 'pushPermissionGuide' ? '권한 허용' : '설정 열기'}
              </Button>
            }
          />
        </main>
        <MainBottomNav activeKey="notifications" />
      </div>
    );
  }

  return (
    <div className="relative mx-auto flex h-full min-h-full w-full max-w-md flex-col overflow-x-hidden bg-background">
      <TopAppBar
        className="shrink-0"
        title="알림"
        onBack={onBack}
        rightSlot={
          <button
            type="button"
            aria-label="설정"
            onClick={onSettings}
            className="inline-flex size-11 items-center justify-center text-text-secondary"
          >
            <Icon name="settings" size="lg" color="currentColor" decorative />
          </button>
        }
      />
      <div className="flex items-center justify-between gap-2 px-5 py-2">
        <div className="flex gap-1.5">
          <Chip
            variant="filter"
            selected={state !== 'unreadOnly'}
            onClick={() => onFilterChange?.('all')}
          >
            전체
          </Chip>
          <Chip
            variant="filter"
            selected={state === 'unreadOnly'}
            onClick={() => onFilterChange?.('unread')}
          >
            안 읽음
          </Chip>
        </div>
        <button
          type="button"
          onClick={onMarkAllAsRead}
          className="text-[13px] text-primary"
        >
          모두 읽음
        </button>
      </div>

      <main
        className={cn(
          state === 'error' || state === 'empty'
            ? mobileMainCenter
            : mobileMainScroll,
        )}
      >
        {state === 'loading' ? (
          <div className="px-3 py-2">
            <NotificationListSkeleton />
          </div>
        ) : state === 'error' ? (
          <ErrorState title="알림을 불러오지 못했어요" onRetry={onRetry} />
        ) : state === 'empty' ? (
          <EmptyState
            icon="bell"
            title="새 알림이 없어요"
            description="초대장 활동이 생기면 알려드릴게요"
          />
        ) : state === 'dateGrouped' ? (
          <div className="px-2">
            <h3 className="px-3 py-2 text-[12px] font-medium text-text-tertiary">
              오늘
            </h3>
            <div className="flex flex-col gap-3">
              {items.slice(0, 3).map((n) => (
                <NotificationItem
                  key={n.id}
                  type={n.type as NotificationType}
                  title={n.title}
                  description={n.description}
                  time={n.time}
                  unread={n.unread}
                  onClick={() => onMarkAsRead?.(n.id)}
                />
              ))}
            </div>
            <h3 className="px-3 pt-3 pb-1 text-[12px] font-medium text-text-tertiary">
              이전
            </h3>
            <div className="flex flex-col gap-3">
              {items.slice(3).map((n) => (
                <NotificationItem
                  key={n.id}
                  type={n.type as NotificationType}
                  title={n.title}
                  description={n.description}
                  time={n.time}
                  onClick={() => onMarkAsRead?.(n.id)}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3 px-2 py-2">
            {(state === 'unreadOnly'
              ? items.filter((n) => n.unread)
              : items
            ).map((n) => (
              <NotificationItem
                key={n.id}
                type={n.type as NotificationType}
                title={n.title}
                description={n.description}
                time={n.time}
                unread={n.unread}
                onClick={() => onMarkAsRead?.(n.id)}
              />
            ))}
          </div>
        )}
      </main>

      <ConfirmModal
        contained
        open={state === 'markAllReadModal'}
        onOpenChange={() => {}}
        title="모든 알림을 읽음 처리할까요?"
        confirmLabel="모두 읽음"
      />
      <MainBottomNav activeKey="notifications" />
    </div>
  );
};

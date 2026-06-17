'use client';

import { Icon, Chip, Button, TopAppBar, ConfirmDialog, EmptyState, ErrorState, Switch, MenuItem } from '@wara/ui';
import { motion, useReducedMotion } from 'framer-motion';
import {
  NotificationItem,
  type NotificationType,
} from '@/components/domain';
import { NotificationListSkeleton } from '@/components/domain/Skeleton';
import { mobileMainCenter, mobileMainScroll } from '@/lib/mobilePageLayout';
import { pageStagger, pageItem } from '@/lib/motion';
import { cn } from '@/lib/cn';
import { useState } from 'react';

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
  onDelete?: () => void;
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
  onRequestPushPermission?: () => void;
  onDeleteAll?: () => void;
  isMarkingAllRead?: boolean;
  isDeletingAll?: boolean;
}

export const Notifications = ({
  state = 'default',
  items = [],
  onBack,
  onMarkAllAsRead,
  onMarkAsRead,
  onFilterChange,
  onRetry,
  onSettings,
  onRequestPushPermission,
  onDeleteAll,
  isMarkingAllRead,
  isDeletingAll,
}: NotificationsProps) => {
  const [markAllReadModalOpen, setMarkAllReadModalOpen] = useState(
    state === 'markAllReadModal',
  );
  const [deleteAllModalOpen, setDeleteAllModalOpen] = useState(false);
  const reduce = useReducedMotion();

  if (state === 'settings') {
    return (
      <div className="relative mx-auto flex h-screen w-full max-w-md flex-col overflow-x-hidden bg-surface-muted lg:max-w-none">
        <TopAppBar className="shrink-0 lg:mx-auto lg:w-full lg:max-w-5xl" title="알림 설정" onBack={onBack} />
        <main className="min-h-0 flex-1 overflow-y-auto lg:mx-auto lg:w-full lg:max-w-5xl">
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
      </div>
    );
  }

  if (state === 'pushPermissionGuide' || state === 'pushDisabledGuide') {
    return (
      <div className="relative mx-auto flex h-screen w-full max-w-md flex-col overflow-x-hidden bg-background lg:max-w-none">
        <TopAppBar className="shrink-0 lg:mx-auto lg:w-full lg:max-w-5xl" title="알림" onBack={onBack} />
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
              state === 'pushPermissionGuide' ? (
                <Button onClick={onRequestPushPermission}>권한 허용</Button>
              ) : (
                <Button variant="secondary">
                  설정 {'>'} 알림에서 직접 켜주세요
                </Button>
              )
            }
          />
        </main>
      </div>
    );
  }

  return (
    <div className="relative mx-auto flex h-screen w-full max-w-md flex-col overflow-x-hidden bg-background lg:max-w-none">
      <TopAppBar
        className="shrink-0 lg:mx-auto lg:w-full lg:max-w-5xl"
        title="알림"
        onBack={onBack}
        rightSlot={
          <button
            type="button"
            aria-label="설정"
            onClick={onSettings}
            className="inline-flex size-11 items-center justify-center text-text-muted"
          >
            <Icon name="settings" size="lg" color="currentColor" decorative />
          </button>
        }
      />
      <div className="flex items-center justify-between gap-2 px-page py-2 lg:mx-auto lg:w-full lg:max-w-5xl">
        <div className="flex gap-1.5">
          <Chip            selected={state !== 'unreadOnly'}
            onClick={() => onFilterChange?.('all')}
          >
            전체
          </Chip>
          <Chip            selected={state === 'unreadOnly'}
            onClick={() => onFilterChange?.('unread')}
          >
            안 읽음
          </Chip>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMarkAllReadModalOpen(true)}
            disabled={isMarkingAllRead}
            className="text-[13px] text-primary disabled:opacity-40"
          >
            모두 읽음
          </button>
          <button
            type="button"
            onClick={() => setDeleteAllModalOpen(true)}
            disabled={isDeletingAll}
            className="text-[13px] text-danger disabled:opacity-40"
          >
            전체 삭제
          </button>
        </div>
      </div>

      <main
        className={cn(
          state === 'error' || state === 'empty'
            ? mobileMainCenter
            : mobileMainScroll,
          "lg:mx-auto lg:w-full lg:max-w-5xl",
        )}
      >
        {state === 'loading' ? (
          <NotificationListSkeleton />
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
            <h3 className="px-3 py-2 text-[12px] font-medium text-text-subtle">
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
                  onDelete={n.onDelete}
                  onClick={() => onMarkAsRead?.(n.id)}
                />
              ))}
            </div>
            <h3 className="px-3 pt-3 pb-1 text-[12px] font-medium text-text-subtle">
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
                  onDelete={n.onDelete}
                  onClick={() => onMarkAsRead?.(n.id)}
                />
              ))}
            </div>
          </div>
        ) : (
          <motion.div
            className="flex flex-col gap-3 px-2 py-2"
            variants={pageStagger}
            initial={reduce ? false : 'hidden'}
            animate="show"
          >
            {(state === 'unreadOnly'
              ? items.filter((n) => n.unread)
              : items
            ).map((n) => (
              <motion.div key={n.id} variants={pageItem}>
                <NotificationItem
                  type={n.type as NotificationType}
                  title={n.title}
                  description={n.description}
                  time={n.time}
                  unread={n.unread}
                  onDelete={n.onDelete}
                  onClick={() => onMarkAsRead?.(n.id)}
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </main>

      <ConfirmDialog
        open={markAllReadModalOpen}
        onOpenChange={setMarkAllReadModalOpen}
        title="모든 알림을 읽음 처리할까요?"
        confirmLabel="모두 읽음"
        onConfirm={() => {
          onMarkAllAsRead?.();
          setMarkAllReadModalOpen(false);
        }}
      />

      <ConfirmDialog
        open={deleteAllModalOpen}
        onOpenChange={setDeleteAllModalOpen}
        title="모든 알림을 삭제할까요?"
        confirmLabel="전체 삭제"
        tone="danger"
        onConfirm={() => {
          onDeleteAll?.();
          setDeleteAllModalOpen(false);
        }}
      />
    </div>
  );
};

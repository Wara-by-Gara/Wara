'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Notifications } from '@/screens/Notifications';
import type { NotificationsState } from '@/screens/Notifications';
import {
  useNotifications,
  useMarkAsRead,
  useMarkAllAsRead,
  useDeleteNotification,
  useDeleteAllNotifications,
  useNotificationSettings,
  useUpdateNotificationSettings,
} from '@/hooks/useNotifications';
import { ROUTES } from '@/constants/routes';
import { usePushSubscription } from '@/hooks/usePushSubscription';
import { NotificationSettingsSheet } from '@/components/notifications/notification-settings-sheet';
import { NotificationSettingsForm } from '@/components/notifications/notification-settings-form';
import type { NotificationSettingKey } from '@/components/notifications/notification-settings-form';
import type { NotificationType as WebNotificationType } from '@/components/domain';

const API_TO_WEB_TYPE: Record<string, WebNotificationType> = {
  photo: 'newPhoto',
  feedback: 'newComment',
  remind: 'eventReminder',
  arrived: 'newRsvp',
  nudge: 'hostNotice',
  invitation_date: 'invitationUpdated',
  participantLocations: 'invitationUpdated',
  eventLocations: 'invitationUpdated',
  ai_complete: 'newPhoto',
  vote_reminder: 'eventReminder',
  vote_tied: 'eventReminder',
  vote_confirmed: 'eventReminder',
  message: 'newComment',
};

// ai_complete는 content가 JSON(클라 파싱용)이라 피드 제목은 사람이 읽는 문구로 변환.
function displayTitle(type: string, content: string): string {
  if (type === 'ai_complete') {
    try {
      const parsed = JSON.parse(content) as { success?: boolean };
      return parsed.success
        ? 'AI 커버 이미지가 완성됐어요'
        : 'AI 커버 이미지 생성에 실패했어요';
    } catch {
      return 'AI 커버 이미지 생성이 완료됐어요';
    }
  }
  return content;
}

export default function NotificationsContainer() {
  const router = useRouter();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [pushPermission, setPushPermission] = useState<NotificationPermission | null>(null);
  const { enable: enablePush } = usePushSubscription();

  useEffect(() => {
    if (typeof Notification !== 'undefined') {
      setPushPermission(Notification.permission);
    }
  }, []);

  // 이미 권한을 허용한 사용자도 이 화면 진입 시 구독을 보장 (구독은 멱등).
  useEffect(() => {
    if (pushPermission === 'granted') {
      void enablePush();
    }
  }, [pushPermission, enablePush]);

  const { data, isLoading, isError, refetch } = useNotifications();
  const { mutate: markAsRead } = useMarkAsRead();
  const { mutate: markAllAsRead, isPending: isMarkingAllRead } = useMarkAllAsRead();
  const { mutate: deleteNotification } = useDeleteNotification();
  const { mutate: deleteAllNotifications, isPending: isDeletingAll } = useDeleteAllNotifications();
  const { data: settings, isLoading: isSettingsLoading } = useNotificationSettings();
  const { mutate: updateSettings, isPending: isSettingsPending } = useUpdateNotificationSettings();

  const allItems = data?.pages.flatMap((p) => p.items) ?? [];
  const items = filter === 'unread' ? allItems.filter((n) => !n.isRead) : allItems;

  const mappedItems = items.map((n) => ({
    id: n.id,
    type: API_TO_WEB_TYPE[n.type] ?? 'invitationUpdated',
    title: displayTitle(n.type, n.content),
    time: new Date(n.createdAt).toLocaleString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
    unread: !n.isRead,
    onDelete: () => deleteNotification(n.id),
  }));

  const handleRequestPushPermission = async () => {
    if (typeof Notification === 'undefined') return;
    const result = await Notification.requestPermission();
    setPushPermission(result);
    // 허용 직후 바로 푸시 구독 생성 (granted effect와 별개로 즉시 반영)
    if (result === 'granted') void enablePush();
  };

  const baseState: NotificationsState = isLoading
    ? 'loading'
    : isError
      ? 'error'
      : allItems.length === 0
        ? 'empty'
        : filter === 'unread'
          ? 'unreadOnly'
          : 'default';

  const state: NotificationsState =
    pushPermission === 'default' ? 'pushPermissionGuide' :
    pushPermission === 'denied' ? 'pushDisabledGuide' :
    baseState;
  const VOTE_NOTIFICATION_TYPES = new Set(['vote_reminder', 'vote_tied', 'vote_confirmed']);

  const handleItemClick = (id: string) => {
    const notification = allItems.find((n) => n.id === id);
    if (notification && !notification.isRead) markAsRead(id);
    if (!notification) return;

    // 참가자 위치 공유 알림 → 알림 설정 시트 (on/off 토글)
    if (notification.targetType === 'participantLocations') {
      setSettingsOpen(true);
      return;
    }

    if (!notification.targetId) return;

    // DM 알림 → 대화방으로 이동
    if (notification.targetType === 'conversation') {
      router.push(ROUTES.CHAT.ROOM(notification.targetId));
      return;
    }

    if (notification.targetType === 'invitation') {
      if (VOTE_NOTIFICATION_TYPES.has(notification.type)) {
        router.push(ROUTES.INVITATIONS.VOTE(notification.targetId));
      } else {
        router.push(ROUTES.INVITATIONS.DETAIL(notification.targetId));
      }
      return;
    }
    // sub-resource 라우팅 — invitationId가 있을 때만
    const invId = notification.invitationId;
    if (!invId) return;
    if (notification.targetType === 'photo') {
      router.push(ROUTES.INVITATIONS.DETAIL(invId));
    } else if (notification.targetType === 'mission') {
      router.push(ROUTES.INVITATIONS.DETAIL(invId));
    } else if (notification.targetType === 'feedback') {
      router.push(`${ROUTES.INVITATIONS.DETAIL(invId)}?focus=comments`);
    }
  };

  return (
    <>
      <Notifications
        state={state}
        items={mappedItems}
        onMarkAllAsRead={() => markAllAsRead()}
        onMarkAsRead={handleItemClick}
        onFilterChange={setFilter}
        onRetry={() => refetch()}
        onSettings={() => setSettingsOpen(true)}
        onRequestPushPermission={handleRequestPushPermission}
        onDeleteAll={() => deleteAllNotifications()}
        isMarkingAllRead={isMarkingAllRead}
        isDeletingAll={isDeletingAll}
      />
      <NotificationSettingsSheet open={settingsOpen} onClose={() => setSettingsOpen(false)}>
        <NotificationSettingsForm
          settings={settings}
          isLoading={isSettingsLoading}
          isPending={isSettingsPending}
          onToggle={(key: NotificationSettingKey, value: boolean) =>
            updateSettings({ [key]: value })
          }
        />
      </NotificationSettingsSheet>
    </>
  );
}

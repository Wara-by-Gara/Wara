'use client';

import type { Notification, NotificationType } from '@/lib/api/notifications';

const TYPE_LABELS: Record<NotificationType, string> = {
  remind: '리마인드',
  participantLocations: '참가자 위치',
  eventLocations: '행사 위치',
  feedback: '피드백',
  invitation_date: '날짜',
  photo: '사진',
};

type Props = {
  notification: Notification;
  onRead: (id: string) => void;
};

export function NotificationItem({ notification, onRead }: Props) {
  return (
    <button
      type="button"
      onClick={() => !notification.isRead && onRead(notification.id)}
      className={`w-full text-left px-4 py-3 flex gap-3 hover:bg-surface transition-colors ${
        notification.isRead ? '' : 'bg-primary-soft/40'
      }`}
    >
      <span className={`mt-1.5 size-2 rounded-full flex-shrink-0 ${notification.isRead ? '' : 'bg-primary'}`} />
      <div className="flex-1 min-w-0">
        <div className="mb-0.5">
          <span className="text-xs font-medium text-text-secondary">
            {TYPE_LABELS[notification.type]}
          </span>
        </div>
        <p className="text-sm text-text-primary">{notification.content}</p>
        <p className="text-xs text-text-tertiary mt-1">
          {new Date(notification.createdAt).toLocaleString('ko-KR', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </div>
    </button>
  );
}

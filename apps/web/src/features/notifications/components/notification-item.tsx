'use client';

import type { Notification, NotificationType } from '../types';

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
      className={`w-full text-left px-4 py-3 flex gap-3 hover:bg-gray-50 transition-colors ${
        notification.isRead ? '' : 'bg-blue-50/50'
      }`}
    >
      {!notification.isRead && (
        <span className="mt-1.5 w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
      )}
      {notification.isRead && <span className="mt-1.5 w-2 h-2 flex-shrink-0" />}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-xs font-medium text-gray-500">
            {TYPE_LABELS[notification.type]}
          </span>
        </div>
        <p className="text-sm text-gray-800">{notification.content}</p>
        <p className="text-xs text-gray-400 mt-1">
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

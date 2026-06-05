'use client';

import { Icon } from '@/components/icons';
import type { Notification, NotificationType } from '@/lib/api/notifications';

const TYPE_LABELS: Record<NotificationType, string> = {
  remind: '리마인드',
  participantLocations: '참가자 위치',
  eventLocations: '행사 위치',
  feedback: '피드백',
  invitation_date: '날짜',
  photo: '사진',
  arrived: 'RSVP',
  nudge: '공지',
  vote_reminder: '투표',
  vote_tied: '투표',
  vote_confirmed: '날짜 확정',
  ai_complete: 'AI 사진',
};

type Props = {
  notification: Notification;
  onReadAction: (id: string) => void;
  onDelete: (id: string) => void;
};

export function NotificationItem({ notification, onReadAction, onDelete }: Props) {
  return (
    <div className={`flex items-center ${notification.isRead ? '' : 'bg-primary-soft/40'}`}>
      <button
        type="button"
        onClick={() => !notification.isRead && onReadAction(notification.id)}
        className="flex-1 text-left px-4 py-3 flex gap-3 hover-emphasis-sm min-w-0"
      >
        <span
          className={`mt-1.5 size-2 rounded-full shrink-0 ${notification.isRead ? '' : 'bg-primary'}`}
        />
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
      <button
        type="button"
        onClick={() => onDelete(notification.id)}
        aria-label="알림 삭제"
        className="shrink-0 p-2 mr-2 text-text-secondary hover:text-red-400 transition-colors"
      >
        <Icon name="x" size="sm" color="currentColor" decorative />
      </button>
    </div>
  );
}

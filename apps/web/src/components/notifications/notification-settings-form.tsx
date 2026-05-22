'use client';

import { Switch } from '@/components/primitives/Switch';
import type { NotificationSettings } from '@/lib/api/notifications';

export type NotificationSettingKey = keyof Pick<
  NotificationSettings,
  | 'isRemind'
  | 'isFeedback'
  | 'isInvitationDate'
  | 'isPhoto'
  | 'isMission'
  | 'isParticipantLocations'
  | 'isEventLocations'
>;

const SETTINGS: {
  key: NotificationSettingKey;
  label: string;
  description: string;
}[] = [
  { key: 'isRemind', label: '리마인드', description: '행사 전 알림' },
  { key: 'isFeedback', label: '피드백', description: '새 피드백 알림' },
  {
    key: 'isInvitationDate',
    label: '날짜 변경',
    description: '행사 날짜 변경 알림',
  },
  { key: 'isPhoto', label: '사진', description: '새 사진 업로드 알림' },
  { key: 'isMission', label: '미션', description: '미션 관련 알림' },
  {
    key: 'isParticipantLocations',
    label: '참가자 위치',
    description: '참가자 위치 공유 알림',
  },
  {
    key: 'isEventLocations',
    label: '행사 위치',
    description: '행사 위치 변경 알림',
  },
];

interface Props {
  settings?: NotificationSettings | null;
  isLoading: boolean;
  isPending: boolean;
  onToggle: (key: NotificationSettingKey, value: boolean) => void;
}

export function NotificationSettingsForm({
  settings,
  isLoading,
  isPending,
  onToggle,
}: Props) {
  if (isLoading) {
    return (
      <div className="py-12 text-center text-sm text-text-tertiary">
        로딩 중...
      </div>
    );
  }

  return (
    <div className="divide-y divide-border">
      {SETTINGS.map(({ key, label, description }) => {
        const enabled = settings?.[key] ?? true;
        return (
          <div
            key={key}
            className="flex items-center justify-between px-4 py-4"
          >
            <div>
              <p className="text-sm font-medium text-text-primary">{label}</p>
              <p className="text-xs text-text-tertiary mt-0.5">{description}</p>
            </div>
            <Switch
              checked={enabled}
              onCheckedChange={(value) => onToggle(key, value)}
              disabled={isPending}
            />
          </div>
        );
      })}
    </div>
  );
}

// 리마인드 수신 설정 훅 — 알림설정(/notifications/settings)의 isRemind 조회·변경.
// api/reminders는 api 배럴(@/api)에 등록돼 있지 않아 파일 경로로 직접 import한다.

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  fetchNotificationSettings,
  reminderKeys,
  updateNotificationSettings,
  type NotificationSettings,
  type UpdateNotificationSettingsPayload,
} from '@/api/reminders';

export function useReminderSettings() {
  return useQuery({
    queryKey: reminderKeys.settings,
    queryFn: ({ signal }) => fetchNotificationSettings({ signal }),
  });
}

export function useUpdateReminderSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateNotificationSettingsPayload) =>
      updateNotificationSettings(payload),
    onSuccess: (updated: NotificationSettings) => {
      qc.setQueryData(reminderKeys.settings, updated);
    },
  });
}

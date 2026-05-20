'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchNotificationSettings, updateNotificationSettings } from '../api';
import type { UpdateNotificationSettingsDto } from '../types';

export function useNotificationSettings() {
  return useQuery({
    queryKey: ['notifications', 'settings'],
    queryFn: fetchNotificationSettings,
  });
}

export function useUpdateNotificationSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: UpdateNotificationSettingsDto) =>
      updateNotificationSettings(dto),
    onSuccess: (data) => {
      queryClient.setQueryData(['notifications', 'settings'], data);
    },
  });
}

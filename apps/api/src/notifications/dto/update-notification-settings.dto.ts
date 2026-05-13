import { z } from 'zod';

/**
 * 알림 설정 수정
 * PATCH /notifications/settings
 *
 * 각 카테고리별 알림 on/off 설정
 */
export const UpdateNotificationSettingsSchema = z.object({
  isRemind: z.boolean().optional(),
  isFeedback: z.boolean().optional(),
  isInvitationDate: z.boolean().optional(),
  isPhoto: z.boolean().optional(),
  isMission: z.boolean().optional(),
  isParticipantLocations: z.boolean().optional(),
  isEventLocations: z.boolean().optional(),
});

export type UpdateNotificationSettingsDto = z.infer<typeof UpdateNotificationSettingsSchema>;

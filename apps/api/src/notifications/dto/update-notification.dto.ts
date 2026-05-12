import { z } from 'zod';

/**
 * 알림 읽음 표시
 * PATCH /notifications/:id
 */
export const UpdateNotificationSchema = z.object({
  isRead: z.boolean(),
});

export type UpdateNotificationDto = z.infer<typeof UpdateNotificationSchema>;

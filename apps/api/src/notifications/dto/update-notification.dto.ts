import { z } from 'zod';

export const UpdateNotificationSchema = z.object({
  isRead: z.boolean(),
});

export type UpdateNotificationDto = z.infer<typeof UpdateNotificationSchema>;

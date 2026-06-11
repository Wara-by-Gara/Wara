import { z } from 'zod';

export const UpdateStatusMessageSchema = z.object({
  message: z.string().trim().min(1).max(100),
});

export type UpdateStatusMessageDto = z.infer<typeof UpdateStatusMessageSchema>;

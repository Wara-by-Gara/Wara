import { z } from 'zod';

export const CreateTextBlastSchema = z.object({
  message: z.string().trim().min(1).max(500),
});

export type CreateTextBlastDto = z.infer<typeof CreateTextBlastSchema>;

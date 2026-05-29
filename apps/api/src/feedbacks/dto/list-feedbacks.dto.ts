import { z } from 'zod';

export const ListFeedbacksSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export type ListFeedbacksDto = z.infer<typeof ListFeedbacksSchema>;

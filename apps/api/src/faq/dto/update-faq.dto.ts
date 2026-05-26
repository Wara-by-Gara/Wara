import { z } from 'zod';

export const updateFaqSchema = z.object({
  question: z.string().min(1).max(200).optional(),
  answer: z.string().min(1).max(2000).optional(),
  sortOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

export type UpdateFaqDto = z.infer<typeof updateFaqSchema>;

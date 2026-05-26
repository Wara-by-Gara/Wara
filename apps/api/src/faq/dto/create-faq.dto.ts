import { z } from 'zod';

export const createFaqSchema = z.object({
  question: z.string().min(1).max(200),
  answer: z.string().min(1).max(2000),
  sortOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

export type CreateFaqDto = z.infer<typeof createFaqSchema>;

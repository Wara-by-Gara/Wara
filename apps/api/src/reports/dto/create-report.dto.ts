import { z } from 'zod';

export const createReportSchema = z.object({
  targetType: z.enum(['photo', 'feedback']),
  targetId:   z.string().min(1),
  reason:     z.string().trim().max(500).optional(),
});

export type CreateReportDto = z.infer<typeof createReportSchema>;

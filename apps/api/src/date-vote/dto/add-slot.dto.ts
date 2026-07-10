import { z } from 'zod';

// date/label 중 어느 쪽이 필요한지는 poll.voteType 기준으로 service에서 검증한다.
export const addSlotSchema = z.object({
  date:      z.string()
               .regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD')
               .refine((d) => !isNaN(new Date(d).getTime()), 'invalid calendar date')
               .optional(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'startTime must be HH:MM').optional(),
  label:     z.string().trim().min(1).max(100).optional(),
  sortOrder: z.number().int().min(0).optional(),
});

export type AddSlotDto = z.infer<typeof addSlotSchema>;

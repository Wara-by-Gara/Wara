import { z } from 'zod';

export const addSlotSchema = z.object({
  date:      z.string()
               .regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD')
               .refine((d) => !isNaN(new Date(d).getTime()), 'invalid calendar date'),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'startTime must be HH:MM').optional(),
  sortOrder: z.number().int().min(0).optional(),
});

export type AddSlotDto = z.infer<typeof addSlotSchema>;

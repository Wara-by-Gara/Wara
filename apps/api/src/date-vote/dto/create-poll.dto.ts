import { z } from 'zod';

const slotSchema = z.object({
  date:      z.string()
               .regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD')
               .refine((d) => !isNaN(new Date(d).getTime()), 'invalid calendar date'),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'startTime must be HH:MM').optional(),
  sortOrder: z.number().int().min(0).optional(),
});

export const createPollSchema = z.object({
  closesAt:    z.string()
                .datetime()
                .refine((d) => new Date(d) > new Date(), 'closesAt must be in the future'),
  isAnonymous: z.boolean().default(false),
  slots:       z.array(slotSchema).min(1).max(30),
});

export type CreatePollDto = z.infer<typeof createPollSchema>;

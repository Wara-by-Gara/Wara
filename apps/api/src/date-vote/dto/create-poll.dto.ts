import { z } from 'zod';
import { findDuplicateVoteSlotKey } from '../vote-slot.util';

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
                .refine((d) => new Date(d) > new Date(), 'closesAt must be in the future')
                .optional(),
  isAnonymous: z.boolean().default(false),
  slots:       z.array(slotSchema).min(1).max(30),
}).superRefine((dto, ctx) => {
  if (findDuplicateVoteSlotKey(dto.slots)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'duplicate date+startTime in slots',
      path: ['slots'],
    });
  }
});

export type CreatePollDto = z.infer<typeof createPollSchema>;

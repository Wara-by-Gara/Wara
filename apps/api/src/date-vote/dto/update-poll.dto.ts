import { z } from 'zod';

export const updatePollSchema = z.object({
  title:       z.string().trim().min(1).max(100).nullable().optional(),
  closesAt:    z.string()
                .datetime()
                .refine((d) => new Date(d) > new Date(), 'closesAt must be in the future')
                .optional(),
  isAnonymous: z.boolean().optional(),
}).refine(
  (d) => d.title !== undefined || d.closesAt !== undefined || d.isAnonymous !== undefined,
  { message: 'At least one field must be provided' },
);

export type UpdatePollDto = z.infer<typeof updatePollSchema>;

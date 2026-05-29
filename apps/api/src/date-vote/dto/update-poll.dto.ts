import { z } from 'zod';

export const updatePollSchema = z.object({
  closesAt:    z.string()
                .datetime()
                .refine((d) => new Date(d) > new Date(), 'closesAt must be in the future')
                .optional(),
  isAnonymous: z.boolean().optional(),
}).refine((d) => d.closesAt !== undefined || d.isAnonymous !== undefined, {
  message: 'At least one field must be provided',
});

export type UpdatePollDto = z.infer<typeof updatePollSchema>;

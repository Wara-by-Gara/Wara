import { z } from 'zod';

export const ListParticipantsQuerySchema = z.object({
  rsvpStatus: z.enum(['attending', 'undecided', 'absent']).optional(),
});

export type ListParticipantsQuery = z.infer<typeof ListParticipantsQuerySchema>;

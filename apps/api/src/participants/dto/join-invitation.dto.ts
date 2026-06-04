import { z } from 'zod';

export const JoinInvitationSchema = z.object({
  rsvpStatus: z.enum(['attending', 'undecided', 'absent']),
  note: z.string().max(200).optional(),
});

export type JoinInvitationDto = z.infer<typeof JoinInvitationSchema>;

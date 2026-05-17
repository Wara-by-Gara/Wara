import { z } from 'zod';

export const JoinInvitationSchema = z.object({
  rsvpStatus: z.enum(['attending', 'undecided', 'absent']),
});

export type JoinInvitationDto = z.infer<typeof JoinInvitationSchema>;

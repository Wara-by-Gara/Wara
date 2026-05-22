import { z } from 'zod';

export const JoinInvitationSchema = z.object({
  rsvpStatus: z.enum(['attending', 'undecided', 'absent']),
  displayName: z.string().min(1).max(100).optional(),
  note: z.string().max(200).optional(),
});

export type JoinInvitationDto = z.infer<typeof JoinInvitationSchema>;

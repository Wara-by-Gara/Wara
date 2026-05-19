import { z } from 'zod';

/**
 * RSVP 상태 수정
 * PATCH /invitations/:invitationId/participants/:id
 */
export const UpdateRsvpSchema = z.object({
  rsvpStatus: z.enum(['attending', 'undecided', 'absent']),
});

export type UpdateRsvpDto = z.infer<typeof UpdateRsvpSchema>;

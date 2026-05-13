import { z } from 'zod';

export const UpdateInvitationStatusSchema = z.object({
  status: z.literal('closed'),
  reason: z.string().min(1).max(500).optional(),
});

export type UpdateInvitationStatusDto = z.infer<typeof UpdateInvitationStatusSchema>;

import { z } from 'zod';

/**
 * 초대장 수정
 * PATCH /invitations/:id
 */
export const UpdateInvitationSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  description: z.string().min(1).optional(),
  mainImageKey: z.string().min(1).optional(),
  templateId: z.string().optional().nullable(),
  eventStartAt: z.coerce.date().optional().nullable(),
  isMissionEnabled: z.boolean().optional(),
  status: z.enum(['active', 'closed']).optional(),
});

export type UpdateInvitationDto = z.infer<typeof UpdateInvitationSchema>;

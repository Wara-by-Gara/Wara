import { z } from 'zod';

/**
 * 초대장 생성
 * POST /invitations
 */
export const CreateInvitationSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().min(1),
  mainImageKey: z.string().min(1),
  templateId: z.string().optional(),
  eventStartAt: z.coerce.date().optional(),
  isMissionEnabled: z.boolean().optional(),
});

export type CreateInvitationDto = z.infer<typeof CreateInvitationSchema>;

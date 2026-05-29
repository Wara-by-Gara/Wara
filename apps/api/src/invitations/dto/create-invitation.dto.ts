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
  bgColor: z.string().max(50).optional(),
  font: z.string().max(50).optional(),
  rsvpAttendingEmoji: z.string().max(10).optional(),
  rsvpAttendingLabel: z.string().max(20).optional(),
  rsvpMaybeEmoji: z.string().max(10).optional(),
  rsvpMaybeLabel: z.string().max(20).optional(),
  rsvpDeclinedEmoji: z.string().max(10).optional(),
  rsvpDeclinedLabel: z.string().max(20).optional(),
});

export type CreateInvitationDto = z.infer<typeof CreateInvitationSchema>;

import { z } from 'zod';

/**
 * 초대장 수정
 * PATCH /invitations/:id
 */
export const UpdateInvitationSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  description: z.string().min(1).optional(),
  mainImageKey: z.string().min(1).optional(),
  mainImageFrame: z.enum(['default', 'upload', 'ai']).optional(),
  uploadedImageKey: z.string().min(1).optional().nullable(),
  templateId: z.string().optional().nullable(),
  eventStartAt: z.coerce.date().optional().nullable(),
  isMissionEnabled: z.boolean().optional(),
  status: z.enum(['active', 'closed']).optional(),
  rsvpAttendingEmoji: z.string().max(10).optional(),
  rsvpAttendingLabel: z.string().max(20).optional(),
  rsvpMaybeEmoji: z.string().max(10).optional(),
  rsvpMaybeLabel: z.string().max(20).optional(),
  rsvpDeclinedEmoji: z.string().max(10).optional(),
  rsvpDeclinedLabel: z.string().max(20).optional(),
});

export type UpdateInvitationDto = z.infer<typeof UpdateInvitationSchema>;

import { z } from 'zod';

/**
 * 초대장 생성
 * POST /invitations
 */
export const CreateInvitationSchema = z
  .object({
    title: z.string().min(1).max(100),
    description: z.string(),
    mainImageKey: z.string().min(1).optional(),
    mainGifUrl: z
      .string()
      .url()
      .startsWith('https://static.klipy.com/')
      .optional(),
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
})
.refine((d) => !!d.mainImageKey || !!d.mainGifUrl, {
  message: 'mainImageKey or mainGifUrl is required',
})
.refine((d) => !d.mainGifUrl || !d.mainImageKey, {
  message: 'mainImageKey and mainGifUrl are mutually exclusive',
});

export type CreateInvitationDto = z.infer<typeof CreateInvitationSchema>;

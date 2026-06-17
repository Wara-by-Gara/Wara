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
  rsvpDeadlineAt: z.coerce.date().optional(),
  accessPassword: z.string().min(1).max(50).optional(),
  isMissionEnabled: z.boolean().optional(),
  isPublic: z.boolean().optional(),
  category: z.string().max(20).optional(),
  fee: z.string().max(100).optional(),
  dressCode: z.string().max(100).optional(),
  parkingInfo: z.string().optional(),
  bgColor: z.string().max(50).optional(),
  font: z.string().max(50).optional(),
  rsvpAttendingEmoji: z.string().max(10).optional(),
  rsvpAttendingLabel: z.string().max(20).optional(),
  rsvpMaybeEmoji: z.string().max(10).optional(),
  rsvpMaybeLabel: z.string().max(20).optional(),
  rsvpDeclinedEmoji: z.string().max(10).optional(),
  rsvpDeclinedLabel: z.string().max(20).optional(),
  animation: z.string().max(50).optional(),
})
.refine((d) => !!d.mainImageKey || !!d.mainGifUrl, {
  message: 'mainImageKey or mainGifUrl is required',
})
.refine((d) => !d.mainGifUrl || !d.mainImageKey, {
  message: 'mainImageKey and mainGifUrl are mutually exclusive',
});

export type CreateInvitationDto = z.infer<typeof CreateInvitationSchema>;

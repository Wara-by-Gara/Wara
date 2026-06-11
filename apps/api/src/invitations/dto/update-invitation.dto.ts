import { z } from 'zod';

/**
 * 초대장 수정
 * PATCH /invitations/:id
 */
export const UpdateInvitationSchema = z
  .object({
    title: z.string().min(1).max(100).optional(),
    // 빈 설명 허용 (생성 스키마와 일치) — min(1)이면 설명 없는 초대장 수정이 막힘
    description: z.string().optional(),
    mainImageKey: z.string().min(1).optional(),
    mainGifUrl: z
      .string()
      .url()
      .startsWith('https://static.klipy.com/')
      .optional(),
    templateId: z.string().optional().nullable(),
  eventStartAt: z.coerce.date().optional().nullable(),
  isMissionEnabled: z.boolean().optional(),
  status: z.enum(['active', 'closed']).optional(),
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
  .refine((d) => !d.mainGifUrl || !d.mainImageKey, {
    message: 'mainImageKey and mainGifUrl are mutually exclusive',
  });

export type UpdateInvitationDto = z.infer<typeof UpdateInvitationSchema>;

import { z } from 'zod';

/**
 * 초대장 수정
 * PATCH /invitations/:id
 */
export const UpdateInvitationSchema = z
  .object({
    title: z.string().min(1).max(100).optional(),
    description: z.string().optional(),
    mainImageKey: z.string().min(1).optional(),
    mainGifUrl: z
      .string()
      .url()
      .startsWith('https://static.klipy.com/')
      .optional(),
    templateId: z.string().optional().nullable(),
  eventStartAt: z.coerce.date().optional().nullable(),
  rsvpDeadlineAt: z.coerce.date().optional().nullable(),
  // 빈 문자열/null = 비밀번호 제거, 값 있으면 설정/변경 (서버에서 해시)
  accessPassword: z.string().max(50).optional().nullable(),
  isMissionEnabled: z.boolean().optional(),
  isPublic: z.boolean().optional(),
  category: z.string().max(20).optional(),
  fee: z.string().max(100).optional().nullable(),
  dressCode: z.string().max(100).optional().nullable(),
  parkingInfo: z.string().optional().nullable(),
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
    // 낙관적 락. 클라이언트가 최근 조회 시점의 invitations.updated_at을 그대로 echo.
    // 미전송 시 검사 스킵(점진적 도입 — 옛 클라이언트 호환). 보내면 mismatch 시 409.
    expectedUpdatedAt: z.coerce.date().optional(),
  })
  .refine((d) => !d.mainGifUrl || !d.mainImageKey, {
    message: 'mainImageKey and mainGifUrl are mutually exclusive',
  });

export type UpdateInvitationDto = z.infer<typeof UpdateInvitationSchema>;

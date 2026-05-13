import { z } from 'zod';

/**
 * 피드백 생성
 * POST /feedbacks
 *
 * 피드백은 초대장 또는 사진에 대한 것이어야 함 (둘 중 하나는 필수)
 * parentId가 있으면 대댓글
 */
export const CreateFeedbackSchema = z
  .object({
    content: z.string().min(1),
    invitationId: z.string().optional(),
    photoId: z.string().optional(),
    parentId: z.string().optional(),
  })
  .refine((data) => data.invitationId || data.photoId, {
    message: 'Either invitationId or photoId must be provided',
    path: ['invitationId'],
  });

export type CreateFeedbackDto = z.infer<typeof CreateFeedbackSchema>;

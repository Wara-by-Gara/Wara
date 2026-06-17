import { z } from 'zod';

/**
 * 피드백 수정
 * PATCH /feedbacks/:id
 *
 * content만 수정 가능 (초대장/사진은 변경 불가)
 */
export const UpdateFeedbackSchema = z
  .object({
    content: z.string().min(1).max(500).optional(),
    gifUrl: z
      .string()
      .url()
      .startsWith('https://static.klipy.com/')
      .optional(),
  })
  .refine((d) => (d.content && d.content.length > 0) || !!d.gifUrl, {
    message: 'content or gifUrl is required',
  });

export type UpdateFeedbackDto = z.infer<typeof UpdateFeedbackSchema>;

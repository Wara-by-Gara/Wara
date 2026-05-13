import { z } from 'zod';

/**
 * 피드백 수정
 * PATCH /feedbacks/:id
 *
 * content만 수정 가능 (초대장/사진은 변경 불가)
 */
export const UpdateFeedbackSchema = z.object({
  content: z.string().min(1),
});

export type UpdateFeedbackDto = z.infer<typeof UpdateFeedbackSchema>;

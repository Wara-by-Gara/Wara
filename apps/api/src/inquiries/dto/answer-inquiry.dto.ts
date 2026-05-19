import { z } from 'zod';

export const answerInquirySchema = z.object({
  answer: z.string().min(1).max(5000),
  status: z.enum(['in_progress', 'resolved']),
});

export type AnswerInquiryDto = z.infer<typeof answerInquirySchema>;

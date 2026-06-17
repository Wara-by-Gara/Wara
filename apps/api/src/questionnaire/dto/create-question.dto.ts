import { z } from 'zod';

export const CreateQuestionSchema = z.object({
  question: z.string().trim().min(1).max(200),
  required: z.boolean().optional(),
});

export type CreateQuestionDto = z.infer<typeof CreateQuestionSchema>;

import { z } from 'zod';

export const SubmitAnswersSchema = z.object({
  answers: z
    .array(
      z.object({
        questionId: z.string(),
        answer: z.string().max(500),
      }),
    )
    .max(30),
});

export type SubmitAnswersDto = z.infer<typeof SubmitAnswersSchema>;

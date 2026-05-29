import { z } from 'zod';

export const submitResponsesSchema = z.object({
  responses: z.array(
    z.object({
      slotId:   z.string().min(1),
      response: z.enum(['good', 'maybe', 'bad']),
    }),
  ).refine(
    (arr) => new Set(arr.map((r) => r.slotId)).size === arr.length,
    { message: 'duplicate slotId in responses' },
  ),
});

export type SubmitResponsesDto = z.infer<typeof submitResponsesSchema>;

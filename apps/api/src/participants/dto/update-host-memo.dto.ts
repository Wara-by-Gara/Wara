import { z } from 'zod';

export const UpdateHostMemoSchema = z.object({
  memo: z.string().max(500).nullable(),
});

export type UpdateHostMemoDto = z.infer<typeof UpdateHostMemoSchema>;

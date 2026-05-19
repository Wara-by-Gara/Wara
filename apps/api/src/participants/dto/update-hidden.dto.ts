import { z } from 'zod';

export const UpdateHiddenSchema = z.object({
  isHidden: z.boolean(),
});

export type UpdateHiddenDto = z.infer<typeof UpdateHiddenSchema>;

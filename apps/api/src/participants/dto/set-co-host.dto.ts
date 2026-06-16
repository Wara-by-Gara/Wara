import { z } from 'zod';

export const SetCoHostSchema = z.object({
  isCoHost: z.boolean(),
});

export type SetCoHostDto = z.infer<typeof SetCoHostSchema>;

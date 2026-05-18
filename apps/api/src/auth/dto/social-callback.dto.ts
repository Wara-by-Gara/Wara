import { z } from 'zod';

export const SocialCallbackSchema = z.object({
  code: z.string().min(1),
  state: z.string().optional(),
  error: z.string().optional(),
  error_description: z.string().optional(),
});

export type SocialCallbackDto = z.infer<typeof SocialCallbackSchema>;

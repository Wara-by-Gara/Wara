import { z } from 'zod';

export const SocialCallbackSchema = z.object({
  code: z.string().min(1),
  state: z.string().min(1),
  error: z.string().optional(),
  error_description: z.string().optional(),
});

export type SocialCallbackDto = z.infer<typeof SocialCallbackSchema>;

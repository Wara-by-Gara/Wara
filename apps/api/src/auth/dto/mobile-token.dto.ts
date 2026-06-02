import { z } from 'zod';

export const MobileTokenSchema = z.object({
  providerToken: z.string().min(1),
});

export type MobileTokenDto = z.infer<typeof MobileTokenSchema>;

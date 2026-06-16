import { z } from 'zod';

export const VerifyAccessPasswordSchema = z.object({
  password: z.string().min(1).max(50),
});

export type VerifyAccessPasswordDto = z.infer<typeof VerifyAccessPasswordSchema>;

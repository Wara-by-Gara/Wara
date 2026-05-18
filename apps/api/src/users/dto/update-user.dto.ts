import { z } from 'zod';

export const UpdateUserSchema = z
  .object({
    nickname: z.string().min(1).max(8).optional(),
    birthYear: z.number().int().min(1900).max(new Date().getFullYear()).optional(),
    gender: z.enum(['male', 'female']).optional(),
    profileImageUrl: z.string().url().optional(),
  })
  .refine((data) => Object.values(data).some((v) => v !== undefined), {
    message: 'At least one field is required',
  });

export type UpdateUserDto = z.infer<typeof UpdateUserSchema>;

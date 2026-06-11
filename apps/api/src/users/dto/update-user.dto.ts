import { z } from 'zod';

export const UpdateUserSchema = z
  .object({
    name: z.string().min(1).max(100).optional(),
    email: z.string().email().optional(),
    nickname: z.string().min(1).max(20).optional(),
    birthYear: z.number().int().min(1900).max(new Date().getFullYear()).optional(),
    gender: z.enum(['male', 'female']).optional(),
    profileImageUrl: z.string().nullable().optional(),
  })
  .refine((data) => Object.values(data).some((v) => v !== undefined), {
    message: 'At least one field is required',
  });

export type UpdateUserDto = z.infer<typeof UpdateUserSchema>;

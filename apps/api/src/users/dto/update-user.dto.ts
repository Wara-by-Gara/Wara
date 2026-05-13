import { z } from 'zod';

/**
 * 사용자 정보 수정
 * PATCH /users/:id
 */
export const UpdateUserSchema = z.object({
  nickname: z.string().max(8).optional(),
  name: z.string().max(100).optional(),
  birthYear: z.number().int().min(1900).max(new Date().getFullYear()).optional(),
  gender: z.enum(['male', 'female']).optional(),
  profileImageUrl: z.string().url().optional(),
});

export type UpdateUserDto = z.infer<typeof UpdateUserSchema>;

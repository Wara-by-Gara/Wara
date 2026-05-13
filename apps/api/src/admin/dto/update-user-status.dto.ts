import { z } from 'zod';
import { UserRole } from '../../common/enums/role.enum';

export const UpdateUserStatusSchema = z
  .object({
    role: z.enum([UserRole.MEMBER, UserRole.ADMIN]).optional(),
    deleted: z.boolean().optional(),
  })
  .refine((value) => value.role !== undefined || value.deleted !== undefined, {
    message: 'AT_LEAST_ONE_FIELD_REQUIRED',
  });

export type UpdateUserStatusDto = z.infer<typeof UpdateUserStatusSchema>;

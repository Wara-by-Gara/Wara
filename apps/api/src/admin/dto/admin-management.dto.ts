import { z } from 'zod';

export const listUsersSchema = z.object({
  query:  z.string().trim().min(1).optional(),
  status: z.enum(['active', 'suspended', 'withdrawn']).optional(),
  limit:  z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});
export type ListUsersDto = z.infer<typeof listUsersSchema>;

export const suspendUserSchema = z.object({
  reason: z.string().trim().max(500).optional(),
});
export type SuspendUserDto = z.infer<typeof suspendUserSchema>;

export const listInvitationsSchema = z.object({
  query:  z.string().trim().min(1).optional(),
  status: z.enum(['active', 'closed']).optional(),
  limit:  z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});
export type ListInvitationsDto = z.infer<typeof listInvitationsSchema>;

export const updateInvitationStatusSchema = z.object({
  status: z.enum(['active', 'closed']),
});
export type UpdateInvitationStatusDto = z.infer<typeof updateInvitationStatusSchema>;

export const updateUserRoleSchema = z.object({
  role: z.enum(['admin', 'member']),
});
export type UpdateUserRoleDto = z.infer<typeof updateUserRoleSchema>;

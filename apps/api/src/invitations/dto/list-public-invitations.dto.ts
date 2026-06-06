import { z } from 'zod';

export const PUBLIC_INVITATION_CATEGORIES = [
  'tech',
  'fitness',
  'food',
  'art',
  'culture',
  'health',
] as const;

export const ListPublicInvitationsSchema = z.object({
  category: z.enum(PUBLIC_INVITATION_CATEGORIES).optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type ListPublicInvitationsDto = z.infer<typeof ListPublicInvitationsSchema>;

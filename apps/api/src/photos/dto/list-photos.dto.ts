import z from 'zod';

export const ListPhotosSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.enum(['createdAt', 'likeCount']).default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

export type ListPhotosDto = z.infer<typeof ListPhotosSchema>;

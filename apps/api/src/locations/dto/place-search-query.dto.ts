import { z } from 'zod';

export const PlaceSearchQuerySchema = z.object({
  query: z.string().min(1),
  page: z.coerce.number().int().min(1).max(45).optional().default(1),
  size: z.coerce.number().int().min(1).max(15).optional().default(15),
});

export type PlaceSearchQueryDto = z.infer<typeof PlaceSearchQuerySchema>;

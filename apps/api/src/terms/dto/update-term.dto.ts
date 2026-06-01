import { z } from 'zod';

export const UpdateTermSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  content: z.string().min(1).optional(),
  isRequired: z.boolean().optional(),
  publishedAt: z.coerce.date().optional(),
});

export type UpdateTermDto = z.infer<typeof UpdateTermSchema>;

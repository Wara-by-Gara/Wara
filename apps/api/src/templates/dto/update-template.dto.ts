import { z } from 'zod';

/**
 * 초대장 템플릿 수정
 * PATCH /templates/:id
 */
export const UpdateTemplateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  previewImageKey: z.string().min(1).optional(),
  theme: z.string().min(1).max(50).optional(),
  font: z.string().min(1).max(50).optional(),
  effect: z.string().max(50).optional(),
  isActive: z.boolean().optional(),
});

export type UpdateTemplateDto = z.infer<typeof UpdateTemplateSchema>;

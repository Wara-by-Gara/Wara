import { z } from 'zod';

/**
 * 초대장 템플릿 생성
 * POST /templates
 */
export const CreateTemplateSchema = z.object({
  name: z.string().min(1).max(100),
  previewImageKey: z.string().min(1),
  theme: z.string().min(1).max(50),
  font: z.string().min(1).max(50),
  effect: z.string().max(50).optional(),
  prompt: z.string().min(1).optional(),
  isActive: z.boolean().optional(),
});

export type CreateTemplateDto = z.infer<typeof CreateTemplateSchema>;

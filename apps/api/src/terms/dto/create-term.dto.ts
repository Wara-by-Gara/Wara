import { z } from 'zod';
import { termTypeEnum } from '../../database/schema';

export const CreateTermSchema = z.object({
  termType: z.enum(termTypeEnum.enumValues),
  version: z.string().regex(/^v?\d+(\.\d+){1,2}$/).max(20),
  title: z.string().min(1).max(255),
  content: z.string().min(1),
  isRequired: z.boolean().default(false),
  publishedAt: z.coerce.date(),
});

export type CreateTermDto = z.infer<typeof CreateTermSchema>;

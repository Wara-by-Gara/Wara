import { z } from 'zod';
import { termTypeEnum } from '../../database/schema';

export const CreateTermSchema = z.object({
  documentId: z.string().min(1).max(64),
  termType: z.enum(termTypeEnum.enumValues),
  version: z.string().regex(/^v?\d+(\.\d+){1,2}$/).max(20),
  title: z.string().min(1).max(255),
  content: z.string().min(1),
  isRequired: z.boolean().default(false),
  effectiveDate: z.coerce.date(),
  publishedAt: z.coerce.date(),
});

export type CreateTermDto = z.infer<typeof CreateTermSchema>;

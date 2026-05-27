import { z } from 'zod';

export const createInquirySchema = z.object({
  inquiryType: z.enum([
    'invitation',
    'photo',
    'notification',
    'mission',
    'bug',
    'feature',
    'general',
  ]),
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(5000),
  isPublic: z.boolean().default(true),
});

export type CreateInquiryDto = z.infer<typeof createInquirySchema>;

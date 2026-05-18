import { z } from 'zod';

export const createInquirySchema = z.object({
  inquiryType: z.enum([
    'invitation',
    'photo',
    'notification',
    'mission',
    'account',
    'general',
  ]),
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(5000),
});

export type CreateInquiryDto = z.infer<typeof createInquirySchema>;

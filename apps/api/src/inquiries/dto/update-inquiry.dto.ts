import { z } from 'zod';

export const updateInquirySchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(5000),
});

export type UpdateInquiryDto = z.infer<typeof updateInquirySchema>;

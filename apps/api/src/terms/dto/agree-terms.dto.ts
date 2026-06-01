import { z } from 'zod';

export const AgreeTermsSchema = z.object({
  termIds: z.array(z.string().min(1)).min(1),
});

export type AgreeTermsDto = z.infer<typeof AgreeTermsSchema>;

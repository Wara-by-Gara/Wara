import { z } from 'zod';

export const updateSettlementSchema = z
  .object({
    isAnonymized: z.boolean().optional(),
  })
  .refine((d) => d.isAnonymized !== undefined, { message: '수정할 항목이 없습니다.' });

export type UpdateSettlementDto = z.infer<typeof updateSettlementSchema>;

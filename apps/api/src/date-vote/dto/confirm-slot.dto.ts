import { z } from 'zod';

export const confirmSlotSchema = z.object({
  slotId: z.string().min(1),
});

export type ConfirmSlotDto = z.infer<typeof confirmSlotSchema>;

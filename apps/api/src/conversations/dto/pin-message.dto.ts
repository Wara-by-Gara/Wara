import { z } from 'zod';

export const PinMessageSchema = z.object({
  messageId: z.string().min(1),
});

export type PinMessageDto = z.infer<typeof PinMessageSchema>;

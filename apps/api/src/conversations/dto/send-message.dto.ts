import { z } from 'zod';

/**
 * 메시지 전송
 * POST /conversations/:id/messages
 */
export const SendMessageSchema = z.object({
  content: z.string().trim().min(1).max(2000),
  replyToMessageId: z.string().min(1).optional(),
});

export type SendMessageDto = z.infer<typeof SendMessageSchema>;

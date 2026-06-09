import { z } from 'zod';

/**
 * 대화방 생성/재사용
 * POST /conversations
 */
export const CreateConversationSchema = z.object({
  targetUserId: z.string().min(1),
});

export type CreateConversationDto = z.infer<typeof CreateConversationSchema>;

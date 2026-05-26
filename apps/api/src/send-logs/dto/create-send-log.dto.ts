import { z } from 'zod';

export const CreateSendLogSchema = z.object({
  channel: z.enum(['kakao', 'link', 'sms', 'email', 'dm', 'instagram']),
});

export type CreateSendLogDto = z.infer<typeof CreateSendLogSchema>;

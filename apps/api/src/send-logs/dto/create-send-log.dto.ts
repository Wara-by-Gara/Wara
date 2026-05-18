import { z } from 'zod';

export const CreateSendLogSchema = z.object({
  channel: z.enum(['link', 'kakao', 'sms', 'email', 'dm']),
  kakaoMeta: z
    .object({
      title: z.string(),
      description: z.string(),
      imageUrl: z.string(),
    })
    .optional(),
});

export type CreateSendLogDto = z.infer<typeof CreateSendLogSchema>;

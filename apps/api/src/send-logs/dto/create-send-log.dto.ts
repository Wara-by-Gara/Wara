import { z } from 'zod';

const KakaoMetaSchema = z.object({
  title: z.string(),
  description: z.string(),
  imageUrl: z.string(),
});

export const CreateSendLogSchema = z.discriminatedUnion('channel', [
  z.object({
    channel: z.literal('kakao'),
    kakaoMeta: KakaoMetaSchema,
  }),
  z.object({
    channel: z.enum(['link', 'sms', 'email', 'dm', 'instagram']),
    kakaoMeta: z.undefined().optional(),
  }),
]);

export type CreateSendLogDto = z.infer<typeof CreateSendLogSchema>;

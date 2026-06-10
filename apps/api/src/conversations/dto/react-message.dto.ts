import { z } from 'zod';

// 허용 이모지 리액션 키 (프론트가 실제 이모지로 매핑)
export const REACTION_EMOJIS = [
  'heart',
  'thumbsup',
  'check',
  'smile',
  'surprise',
  'cry',
] as const;

export const ReactMessageSchema = z.object({
  emoji: z.enum(REACTION_EMOJIS),
});

export type ReactMessageDto = z.infer<typeof ReactMessageSchema>;

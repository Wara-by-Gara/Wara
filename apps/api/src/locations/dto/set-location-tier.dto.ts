import { z } from 'zod';

// 모임별 티어: null 허용(유저 기본값 따름).
export const setMeetingTierSchema = z.object({
  tier: z.enum(['full', 'distance', 'hidden']).nullable(),
});
export type SetMeetingTierDto = z.infer<typeof setMeetingTierSchema>;

// 유저 기본 티어: null 불가.
export const setDefaultTierSchema = z.object({
  tier: z.enum(['full', 'distance', 'hidden']),
});
export type SetDefaultTierDto = z.infer<typeof setDefaultTierSchema>;

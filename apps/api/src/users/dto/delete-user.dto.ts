import { z } from 'zod';

// 탈퇴 사유 카테고리 — FE 라디오 옵션과 동기화.
export const WITHDRAWAL_REASONS = [
  'rarely',
  'alternative',
  'missing',
  'privacy',
  'etc',
] as const;
export type WithdrawalReason = (typeof WITHDRAWAL_REASONS)[number];

export const DeleteUserSchema = z.object({
  reason: z.enum(WITHDRAWAL_REASONS).optional(),
  detail: z.string().max(500).optional(),
});

export type DeleteUserDto = z.infer<typeof DeleteUserSchema>;

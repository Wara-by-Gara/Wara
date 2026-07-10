import { z } from 'zod';

export const ACTIVITY_TYPES = [
  'participant_joined',
  'photo_uploaded',
  'comment_added',
  'vote_confirmed',
] as const;

export type ActivityType = (typeof ACTIVITY_TYPES)[number];

export const listActivitySchema = z.object({
  // 백필용 커서: 이 시각(occurredAt) '이전' 항목을 조회. ISO 8601.
  cursor: z.string().datetime().optional(),
  limit:  z.coerce.number().int().min(1).max(50).default(20),
  // 필터: 콤마 구분 타입 목록. 없으면 전체.
  types:  z.string()
            .optional()
            .transform((v) => (v ? v.split(',').map((s) => s.trim()).filter(Boolean) : undefined))
            .pipe(z.array(z.enum(ACTIVITY_TYPES)).optional()),
});

export type ListActivityDto = z.infer<typeof listActivitySchema>;

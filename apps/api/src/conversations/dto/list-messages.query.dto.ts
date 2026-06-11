import { z } from 'zod';

/**
 * 메시지 목록 (커서 기반 페이지네이션 — 오래된 메시지로 거슬러 올라감)
 * GET /conversations/:id/messages?cursor=&limit=
 */
export const ListMessagesQuerySchema = z.object({
  // 이 메시지 id보다 더 오래된(작은 ULID) 메시지를 조회. 없으면 최신부터.
  cursor: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(30),
});

export type ListMessagesQueryDto = z.infer<typeof ListMessagesQuerySchema>;

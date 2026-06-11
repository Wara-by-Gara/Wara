import { z } from 'zod';

// 단톡방 초대 대상 user id 목록 (최소 1명)
export const InviteSchema = z.object({
  userIds: z.array(z.string()).min(1),
});

export type InviteDto = z.infer<typeof InviteSchema>;

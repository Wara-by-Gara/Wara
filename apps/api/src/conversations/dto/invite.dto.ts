import { z } from 'zod';

// 단톡방 초대 대상 user id 목록 (최소 1명) + 최초 생성 시 공유 방 이름(선택)
export const InviteSchema = z.object({
  userIds: z.array(z.string()).min(1),
  title: z.string().trim().max(50).optional(),
});

export type InviteDto = z.infer<typeof InviteSchema>;

// 내 개인 방 별명 (빈 문자열이면 해제)
export const SetAliasSchema = z.object({
  alias: z.string().max(50),
});

export type SetAliasDto = z.infer<typeof SetAliasSchema>;

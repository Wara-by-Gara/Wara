import { z } from 'zod';

// 호스트가 참가자를 내보낼(kick) 때 남기는 선택적 차단 사유.
// 본인 탈퇴 시에는 body 없이 호출되므로 default({})로 허용.
export const leaveParticipantSchema = z
  .object({
    reason: z.string().trim().max(200).optional(),
  })
  .default({});

export type LeaveParticipantDto = z.infer<typeof leaveParticipantSchema>;

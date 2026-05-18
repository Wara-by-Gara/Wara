import { z } from 'zod';

/**
 * 미션 배정 트리거 (호스트만)
 * POST /invitations/:invitationId/missions/assign
 *
 * V1.0은 body가 비어있어도 됨 (참석 확정 게스트 전원에게 랜덤 균등 배정).
 * 추후 옵션(특정 참가자만 / 시드 고정 등)이 생기면 여기에 추가.
 */
export const AssignMissionsSchema = z.object({}).strict();

export type AssignMissionsDto = z.infer<typeof AssignMissionsSchema>;

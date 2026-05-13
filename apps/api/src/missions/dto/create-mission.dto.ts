import { z } from 'zod';

/**
 * 미션 생성
 * POST /invitations/:invitationId/participants/:participantId/missions
 */
export const CreateMissionSchema = z.object({
  content: z.string().min(1),
});

export type CreateMissionDto = z.infer<typeof CreateMissionSchema>;

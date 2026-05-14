import { z } from 'zod';

/**
 * 미션 생성
 * POST /invitations/:invitationId/missions  (HOST만)
 */
export const CreateMissionSchema = z
  .object({
    content: z.string().trim().min(1).max(200),
  })
  .strict();

export type CreateMissionDto = z.infer<typeof CreateMissionSchema>;

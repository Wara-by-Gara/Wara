import { z } from 'zod';

/**
 * 미션 수정
 * PATCH /invitations/:invitationId/missions/:id  (HOST만)
 */
export const UpdateMissionSchema = z
  .object({
    content: z.string().trim().min(1).max(200),
  })
  .strict();

export type UpdateMissionDto = z.infer<typeof UpdateMissionSchema>;

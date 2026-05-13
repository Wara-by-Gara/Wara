import { z } from 'zod';

/**
 * 참가자 위치 업데이트
 * PATCH /invitations/:invitationId/participant-locations/:id
 */
export const UpdateParticipantLocationSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  accuracy: z.number().min(0),
  isArrived: z.boolean().optional(),
});

export type UpdateParticipantLocationDto = z.infer<typeof UpdateParticipantLocationSchema>;

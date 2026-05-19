import { z } from 'zod';

export const UpdateParticipantLocationSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  accuracy: z.number().min(0),
  isArrived: z.boolean().optional(),
});

export type UpdateParticipantLocationDto = z.infer<
  typeof UpdateParticipantLocationSchema
>;

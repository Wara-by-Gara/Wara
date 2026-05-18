import { z } from 'zod';

export const SetEventLocationSchema = z.object({
  address: z.string().min(1),
  placeName: z.string().min(1).max(100),
  detailAddress: z.string().min(1),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  placeId: z.string().min(1),
});

export type SetEventLocationDto = z.infer<typeof SetEventLocationSchema>;

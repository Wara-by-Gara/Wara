import { z } from 'zod';

export const WeatherResponseSchema = z.object({
  condition: z.string(),
  temperature: z.number(),
  precipProbability: z.number(),
  message: z.string(),
});

export type WeatherResponseDto = z.infer<typeof WeatherResponseSchema>;

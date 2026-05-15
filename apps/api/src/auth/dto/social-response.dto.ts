import { z } from 'zod';
import { Platform } from '../enums/platform.enum';
import { Provider } from '../enums/provider.enum';

export const SocialResponseSchema = z.object({
  accessToken: z.string(),
  user: z.object({
    id: z.string(),
    provider: z.nativeEnum(Provider),
    platform: z.nativeEnum(Platform),
    providerId: z.string(),
    name: z.string().nullable(),
    gender: z.string().nullable(),
    birthYear: z.number().nullable(),
    email: z.string().email().nullable(),
    profileImage: z.string().nullable(),
  }),
});

export type SocialResponseDto = z.infer<typeof SocialResponseSchema>;

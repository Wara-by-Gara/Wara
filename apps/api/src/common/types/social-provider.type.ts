import { z } from 'zod';
import { SOCIAL_PROVIDERS } from '../../../drizzle/schema/enums';

export const SocialProviderSchema = z.enum(SOCIAL_PROVIDERS);
export type SocialProvider = z.infer<typeof SocialProviderSchema>;

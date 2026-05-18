import { z } from 'zod';
import { Provider } from '../enums/provider.enum';

export const ProviderParamSchema = z.object({
  provider: z.nativeEnum(Provider),
});

export type ProviderParamDto = z.infer<typeof ProviderParamSchema>;

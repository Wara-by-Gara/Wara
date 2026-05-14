import { z } from 'zod';

export const CreateMissionSchema = z.object({
  content: z.string().trim().min(1).max(200),
});

export type CreateMissionDto = z.infer<typeof CreateMissionSchema>;

import { z } from 'zod';

export const UpdateMissionSchema = z.object({
  content: z.string().trim().min(1).max(200),
});

export type UpdateMissionDto = z.infer<typeof UpdateMissionSchema>;

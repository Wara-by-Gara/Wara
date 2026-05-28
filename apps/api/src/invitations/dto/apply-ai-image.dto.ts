import { z } from 'zod';

export const ApplyAiImageSchema = z.object({
  /** 사용자가 업로드한 원본 사진의 S3 key */
  imageKey: z.string().min(1),
});

export type ApplyAiImageDto = z.infer<typeof ApplyAiImageSchema>;

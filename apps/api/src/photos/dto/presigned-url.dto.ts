import z from 'zod';

//`photos/${ulid()}/${fileName}`
export const PresignedUrlSchema = z.object({
  fileName: z.string().min(1),
  contentType: z.string().min(1),
});

export type PresignedUrlSchema = z.infer<typeof PresignedUrlSchema>;

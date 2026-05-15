import z from 'zod';

//`photos/${ulid()}/${fileName}`
export const PresignedUrlSchema = z.object({
  fileName: z.string().min(1),
  contentType: z.enum([
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/heic',
    'image/heif',
  ]),
});

export type PresignedUrlSchema = z.infer<typeof PresignedUrlSchema>;

import {z} from 'zod';

//`photos/${ulid()}/${fileName}`
export const PresignedUrlSchema = z.object({
  fileName: z.string().min(1).regex(/^[^/\\]+$/, '파일명에 경로 문자는 사용할 수 없습니다'),
  contentType: z.enum([
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/heic',
    'image/heif',
  ]),
});

export type PresignedUrlDto = z.infer<typeof PresignedUrlSchema>;

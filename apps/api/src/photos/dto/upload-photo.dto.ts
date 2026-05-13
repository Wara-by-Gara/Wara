import { z } from 'zod';

/**
 * 사진 업로드
 * POST /invitations/:invitationId/photos
 *
 * imageKey: S3/스토리지 경로 (클라이언트가 먼저 업로드 후 key를 받아서 전송)
 */
export const UploadPhotoSchema = z.object({
  imageKey: z.string().min(1),
});

export type UploadPhotoDto = z.infer<typeof UploadPhotoSchema>;

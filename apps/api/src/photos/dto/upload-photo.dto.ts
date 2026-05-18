import { z } from 'zod';

/**
 * 사진 업로드
 * POST /invitations/:invitationId/photos
 *
 * imageKey: S3/스토리지 경로 (클라이언트가 먼저 업로드 후 key를 받아서 전송)
 */
export const UploadPhotoSchema = z.object({
  imageKey: z.string().min(1),
  takenAt: z.string().optional(),
  exifMetadata: z
    .object({
      gps_lat: z.number().nullable().optional(),
      gps_lng: z.number().nullable().optional(),
      gps_address: z.string().nullable().optional(),
    })
    .optional(),
});

export type UploadPhotoDto = z.infer<typeof UploadPhotoSchema>;

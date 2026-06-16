import { z } from 'zod';

/**
 * 메시지 전송 — 텍스트 또는 이미지(둘 중 하나 이상 필요)
 * POST /conversations/:id/messages
 */
export const SendMessageSchema = z
  .object({
    content: z.string().trim().max(1000).optional().default(''),
    imageKey: z.string().min(1).optional(),
    replyToMessageId: z.string().min(1).optional(),
  })
  .refine((d) => d.content.length > 0 || !!d.imageKey, {
    message: '메시지 내용 또는 이미지가 필요합니다',
  });

export type SendMessageDto = z.infer<typeof SendMessageSchema>;

/**
 * 메시지 수정 — 텍스트만
 * PATCH /conversations/:id/messages/:messageId
 */
export const EditMessageSchema = z.object({
  content: z.string().trim().min(1).max(1000),
});

export type EditMessageDto = z.infer<typeof EditMessageSchema>;

/**
 * 이미지 업로드용 presigned URL 발급
 * POST /conversations/:id/messages/presigned-url
 */
export const MessageImagePresignedSchema = z.object({
  fileName: z
    .string()
    .min(1)
    .regex(/^[^/\\]+$/, '파일명에 경로 문자는 사용할 수 없습니다'),
  contentType: z.enum([
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/heic',
    'image/heif',
  ]),
});

export type MessageImagePresignedDto = z.infer<typeof MessageImagePresignedSchema>;

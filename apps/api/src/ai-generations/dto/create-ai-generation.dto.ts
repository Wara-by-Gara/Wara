import { z } from 'zod';

export const CreateAiGenerationSchema = z.object({
  // 합성에 사용할 초대장 템플릿 ID. 사용자가 초대장 만들기 단계에서 선택한 값.
  templateId: z.string().min(1),
  // 사용자가 presigned URL로 미리 업로드한 사진의 S3 key.
  // path traversal 방지를 위해 허용 prefix는 service 단에서 추가 검증.
  sourceImageKey: z.string().min(1).max(500),
});

export type CreateAiGenerationDto = z.infer<typeof CreateAiGenerationSchema>;

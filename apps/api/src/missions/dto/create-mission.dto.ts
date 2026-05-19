import { z } from 'zod';

// 제어/zero-width/방향 제어 문자 차단 (OWASP ASVS v5 §5.1.3 / Trojan Source CVE-2021-42574)
const SAFE_TEXT = /^[^\p{Cc}\p{Cf}]*$/u;
const ULID = /^[0-9A-HJKMNP-TV-Z]{26}$/;

/**
 * 미션 생성 (HOST만)
 * - `templateId` 가 있으면 공용 미션 템플릿에서 content를 복사
 * - 둘 다 없으면 검증 실패
 * - 둘 다 있으면 templateId 우선 (content 무시)
 */
export const CreateMissionSchema = z
  .object({
    content: z
      .string()
      .trim()
      .min(1)
      .max(200)
      .regex(SAFE_TEXT, 'content 에 허용되지 않는 문자가 포함되어 있습니다')
      .optional(),
    templateId: z.string().regex(ULID, '유효한 ULID 형식이 아닙니다').optional(),
  })
  .refine((v) => Boolean(v.content) || Boolean(v.templateId), {
    message: 'content 또는 templateId 중 하나는 필수입니다',
    path: ['content'],
  });

export type CreateMissionDto = z.infer<typeof CreateMissionSchema>;

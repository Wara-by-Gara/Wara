import { z } from 'zod';

// 제어/zero-width/방향 제어 문자 차단 (OWASP ASVS v5 §5.1.3 / Trojan Source CVE-2021-42574)
const SAFE_TEXT = /^[^\p{Cc}\p{Cf}]*$/u;

export const UpdateMissionSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1)
    .max(200)
    .regex(SAFE_TEXT, 'content 에 허용되지 않는 문자가 포함되어 있습니다'),
});

export type UpdateMissionDto = z.infer<typeof UpdateMissionSchema>;

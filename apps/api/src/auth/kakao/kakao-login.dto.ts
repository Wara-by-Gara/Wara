import { z } from 'zod';

/**
 * POST /auth/kakao/login
 * iOS Kakao SDK 또는 웹 JS SDK로 발급받은 accessToken을 전달
 */
export const KakaoLoginSchema = z.object({
  accessToken: z.string().min(1, 'accessToken이 필요합니다'),
});

export type KakaoLoginDto = z.infer<typeof KakaoLoginSchema>;

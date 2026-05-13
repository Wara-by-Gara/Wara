import { z } from 'zod';

/**
 * 소셜 로그인 요청
 * POST /auth/social-login
 */
export const SocialLoginSchema = z.object({
  provider: z.enum(['kakao', 'naver', 'apple']),
  accessToken: z.string().min(1, 'Access token is required'),
});

export type SocialLoginDto = z.infer<typeof SocialLoginSchema>;

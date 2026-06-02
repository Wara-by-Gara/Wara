import { z } from 'zod';

const AppleUserNameSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

const AppleUserSchema = z.object({
  name: AppleUserNameSchema.optional(),
  email: z.string().email().optional(),
});

// Apple이 POST form-data로 전송하는 callback payload
// user 필드는 최초 로그인 1회만 포함됨
const appleUserTransform = z
  .union([z.string(), AppleUserSchema])
  .optional()
  .transform((val) => {
    if (typeof val === 'string') {
      try {
        return AppleUserSchema.parse(JSON.parse(val));
      } catch {
        return undefined;
      }
    }
    return val;
  });

// iOS SDK용: id_token + code 필수
export const AppleCallbackSchema = z.object({
  id_token: z.string().min(1),
  code: z.string().min(1),
  state: z.string().optional(),
  nonce: z.string().optional(),
  user: appleUserTransform,
});

// 웹 OAuth용: Apple 에러 응답 시 id_token/code 없이 error만 올 수 있음
export const AppleWebCallbackSchema = z.object({
  id_token: z.string().min(1).optional(),
  code: z.string().min(1).optional(),
  state: z.string().optional(),
  nonce: z.string().optional(),
  error: z.string().optional(),
  user: appleUserTransform,
});

export type AppleCallbackDto = z.infer<typeof AppleCallbackSchema>;
export type AppleWebCallbackDto = z.infer<typeof AppleWebCallbackSchema>;
export type AppleUser = z.infer<typeof AppleUserSchema>;

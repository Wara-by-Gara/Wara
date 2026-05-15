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
export const AppleCallbackSchema = z.object({
  id_token: z.string().min(1),
  code: z.string().min(1),
  state: z.string().optional(),
  user: z
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
    }),
});

export type AppleCallbackDto = z.infer<typeof AppleCallbackSchema>;
export type AppleUser = z.infer<typeof AppleUserSchema>;

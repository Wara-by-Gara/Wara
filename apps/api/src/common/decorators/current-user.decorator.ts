import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import type { JwtPayload } from '../types/jwt-payload.type';

/**
 * 로그인한 유저의 JWT payload를 핸들러 인자로 주입한다.
 *
 * `JwtAuthGuard`가 `request.user`에 채워둔 `JwtPayload` ({ id, role, scope, iat?, exp? })를
 * 그대로 반환한다. `@Public()`이 붙은 endpoint에서는 `undefined`가 들어올 수 있다.
 *
 * 사용: `@Get('me') getMe(@CurrentUser() user: JwtPayload | undefined)`
 */
export const CurrentUser = createParamDecorator(
  (_, ctx: ExecutionContext): JwtPayload | undefined => {
    const request = ctx.switchToHttp().getRequest<Request>();
    return request.user;
  },
);

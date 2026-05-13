import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * 로그인한 유저 정보 꺼내는 데코레이터
 * 사용: @Get('me') getMe(@CurrentUser() user: UserPayloadDto)
 *
 * JwtAuthGuard가 request.user에 저장한 { id, email, role, nickname }을
 * 파라미터로 직접 주입한다.
 */
export const CurrentUser = createParamDecorator(
  (_, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);

import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

/**
 * Role 기반 인가 가드
 *
 * @Roles()가 없는 라우트는 통과 (기본 허용)
 * @Roles('HOST')가 있으면 JWT 페이로드의 role과 비교
 *
 * 반드시 JwtAuthGuard 이후에 실행해야 request.user가 존재함:
 *   @UseGuards(JwtAuthGuard, RolesGuard)
 *
 * 주의: memberRole(HOST/GUEST)이 아닌 userRole(member/admin)을 체크함
 * 초대장 내 역할(HOST/GUEST) 체크는 별도 로직 필요
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // @Roles() 데코레이터 없으면 통과
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.includes(user?.role);
  }
}

import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { ADMIN_SCOPE_KEY } from '../decorators/admin-only.decorator';

const ADMIN_SCOPE_VALUE = 'admin';

@Injectable()
export class AdminScopeGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requireAdminScope = this.reflector.getAllAndOverride<boolean>(
      ADMIN_SCOPE_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requireAdminScope) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('TOKEN_INVALID');
    }

    if (!Array.isArray(user.scope) || !user.scope.includes(ADMIN_SCOPE_VALUE)) {
      throw new ForbiddenException('INSUFFICIENT_SCOPE');
    }

    return true;
  }
}

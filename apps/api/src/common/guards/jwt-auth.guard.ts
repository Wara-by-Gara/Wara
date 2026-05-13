import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

import type { JwtPayload } from '../types/jwt-payload.type';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';


@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractToken(request);

    if (!token) throw new UnauthorizedException('TOKEN_INVALID');

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token);
      request.user = payload;
      return true;
    } catch {
      throw new UnauthorizedException('TOKEN_INVALID');
    }
  }

  private extractToken(request: Request): string | null {
    const auth = request.headers.authorization;
    if (typeof auth === 'string' && auth.startsWith('Bearer ')) {
      return auth.slice(7).trim() || null;
    }
    return null;
  }
}

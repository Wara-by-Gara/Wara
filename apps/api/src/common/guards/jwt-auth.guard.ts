import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService, TokenExpiredError } from '@nestjs/jwt';
import { Request } from 'express';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import type { JwtPayload } from '../types/jwt-payload.type';

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

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();

    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException('TOKEN_INVALID');
    }

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token);

      if (!this.isValidPayload(payload)) {
        throw new UnauthorizedException('TOKEN_INVALID');
      }

      request.user = payload;

      return true;
    } catch (err) {
      if (err instanceof TokenExpiredError) {
        throw new UnauthorizedException('TOKEN_EXPIRED');
      }

      if (err instanceof UnauthorizedException) {
        throw err;
      }

      throw new UnauthorizedException('TOKEN_INVALID');
    }
  }

  private isValidPayload(payload: unknown): payload is JwtPayload {
    if (typeof payload !== 'object' || payload === null) {
      return false;
    }

    const p = payload as Partial<JwtPayload>;

    return (
      typeof p.id === 'string' &&
      p.id.length > 0 &&
      typeof p.role === 'string' &&
      Array.isArray(p.scope)
    );
  }

  private extractToken(request: Request): string | null {
    const authHeader = request.headers.authorization;

    if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
      const token = authHeader.slice(7).trim();

      if (token) {
        return token;
      }
    }

    const cookies = (
      request as Request & {
        cookies?: Record<string, string>;
      }
    ).cookies;

    if (cookies?.accessToken) {
      return cookies.accessToken;
    }

    return null;
  }
}

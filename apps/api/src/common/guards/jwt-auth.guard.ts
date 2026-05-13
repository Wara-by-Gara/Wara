import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthStrategy } from '../../auth/strategies/jwt.strategy';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly strategy: JwtAuthStrategy) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractBearer(request);
    if (!token) throw new UnauthorizedException();
    try {
      request['user'] = await this.strategy.validate(token);
      return true;
    } catch {
      throw new UnauthorizedException();
    }
  }

  private extractBearer(request: Request): string | null {
    const auth = request.headers['authorization'];
    const [type, token] = auth?.split(' ') ?? [];
    return type === 'Bearer' ? (token ?? null) : null;
  }
}

import { createHash } from 'crypto';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthRepository } from './auth.repository';
import { JwtPayload } from '../common/types/jwt-payload.type';

type RefreshPayload = JwtPayload & { type: 'refresh' };

@Injectable()
export class AuthService {
  constructor(
    private readonly repository: AuthRepository,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async issueTokens(user: { id: string; role: string }): Promise<{ accessToken: string; refreshToken: string }> {
    const secret = this.config.getOrThrow<string>('JWT_SECRET');
    const payload: JwtPayload = { id: user.id, role: user.role };

    const accessToken = this.jwtService.sign(payload, this.accessOptions(secret));

    const refreshToken = this.jwtService.sign(
      { ...payload, type: 'refresh' } satisfies RefreshPayload,
      this.refreshOptions(secret),
    );

    await this.repository.saveRefreshToken(user.id, this.hashToken(refreshToken));

    return { accessToken, refreshToken };
  }

  async refresh(refreshToken: string): Promise<{ accessToken: string }> {
    const secret = this.config.getOrThrow<string>('JWT_SECRET');

    let payload: RefreshPayload;
    try {
      payload = this.jwtService.verify<RefreshPayload>(refreshToken, { secret });
    } catch {
      throw new UnauthorizedException();
    }

    if (payload.type !== 'refresh') throw new UnauthorizedException();

    const user = await this.repository.findUserById(payload.id);
    if (!user) throw new UnauthorizedException();

    if (user.refreshToken !== this.hashToken(refreshToken)) {
      throw new UnauthorizedException();
    }

    const accessToken = this.jwtService.sign(
      { id: user.id, role: user.role } satisfies JwtPayload,
      this.accessOptions(secret),
    );

    return { accessToken };
  }

  private accessOptions(secret: string): JwtSignOptions {
    return { secret, expiresIn: this.config.get('JWT_ACCESS_EXPIRES_IN', '15m') as JwtSignOptions['expiresIn'] };
  }

  private refreshOptions(secret: string): JwtSignOptions {
    return { secret, expiresIn: this.config.get('JWT_REFRESH_EXPIRES_IN', '7d') as JwtSignOptions['expiresIn'] };
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}

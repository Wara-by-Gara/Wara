import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthRepository } from './auth.repository';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomBytes } from 'crypto';
import { UserRole } from '../common/enums/role.enum';
import type { JwtPayload } from '../common/types/jwt-payload.type';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private readonly repository: AuthRepository,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  async issueAccessToken(payload: JwtPayload): Promise<string> {
    return await this.jwtService.signAsync(payload);
  }

  async issueRefreshToken(
    userId: string,
    options?: { deviceInfo?: string; ipAddress?: string },
  ): Promise<string> {
    const rawToken = randomBytes(40).toString('hex');
    const tokenHash = this.hashToken(rawToken);

    const refreshExpiresIn = this.config.get<number>(
      'JWT_REFRESH_EXPIRES_IN',
      1209600,
    );
    const expiresAt = new Date(Date.now() + refreshExpiresIn * 1000);

    await this.repository.saveRefreshToken({
      userId,
      tokenHash,
      expiresAt,
      deviceInfo: options?.deviceInfo,
      ipAddress: options?.ipAddress,
    });

    return rawToken;
  }

  async refresh(rawRefreshToken: string) {
    const tokenHash = this.hashToken(rawRefreshToken);
    const stored = await this.repository.findValidRefreshToken(tokenHash);

    if (!stored) {
      throw new UnauthorizedException('TOKEN_INVALID');
    }

    await this.repository.revokeRefreshToken(stored.userId, tokenHash);

    const user = await this.repository.findUserById(stored.userId);
    if (!user) {
      throw new UnauthorizedException('TOKEN_INVALID');
    }

    const payload: JwtPayload = {
      id: user.id,
      role: user.role as UserRole,
      scope: user.role === 'admin' ? ['admin'] : [],
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.issueAccessToken(payload),
      this.issueRefreshToken(user.id),
    ]);
    return { accessToken, refreshToken };
  }
}

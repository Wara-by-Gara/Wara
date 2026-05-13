import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomBytes } from 'crypto';
import type { JwtPayload } from '../common/types/jwt-payload.type';
import { ConfigService } from '@nestjs/config';
import { AuthRepository } from './auth.repository';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

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

  async refresh(
    rawRefreshToken: string,
    options?: { deviceInfo?: string; ipAddress?: string },
  ) {
    const tokenHash = this.hashToken(rawRefreshToken);
    const stored = await this.repository.findValidRefreshToken(tokenHash);

    if (!stored) {
      this.logger.warn('Refresh token not found or invalid');
      throw new UnauthorizedException('TOKEN_INVALID');
    }

    await this.repository.revokeRefreshToken(stored.userId, tokenHash);

    const user = await this.repository.findUserById(stored.userId);
    if (!user) {
      this.logger.warn(`User not found: ${stored.userId}`);
      throw new UnauthorizedException('USER_NOT_FOUND');
    }

    this.logger.debug(`Token refreshed for user: ${user.id}`);
    const payload: JwtPayload = {
      id: user.id,
      role: user.role,
      scope: user.role === 'admin' ? ['admin'] : [],
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.issueAccessToken(payload),
      this.issueRefreshToken(user.id, options),
    ]);
    return { accessToken, refreshToken };
  }

  async logout(rawRefreshToken: string): Promise<void> {
    const tokenHash = this.hashToken(rawRefreshToken);
    const stored = await this.repository.findValidRefreshToken(tokenHash);

    // 이미 만료/무효화된 토큰 → idempotent: 로그아웃된 상태로 간주하고 성공 처리
    if (!stored) {
      this.logger.debug('Logout called with invalid or expired token (idempotent)');
      return;
    }

    await this.repository.revokeRefreshToken(stored.userId, tokenHash);
    this.logger.debug(`User logged out: ${stored.userId}`);
  }
}

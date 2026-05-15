import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomBytes } from 'crypto';
import { UserRole } from '../common/enums/role.enum';
import type { JwtPayload } from '../common/types/jwt-payload.type';
import { ConfigService } from '@nestjs/config';
import { AuthRepository } from './auth.repository';
import { ErrorCode } from '../common/constants/error-codes';

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
  ): Promise<{ rawToken: string; expiresIn: number }> {
    const rawToken = randomBytes(40).toString('hex');
    const tokenHash = this.hashToken(rawToken);

    const expiresIn = this.config.get<number>('JWT_REFRESH_EXPIRES_IN', 1209600);
    const expiresAt = new Date(Date.now() + expiresIn * 1000);

    await this.repository.saveRefreshToken({
      userId,
      tokenHash,
      expiresAt,
      deviceInfo: options?.deviceInfo,
      ipAddress: options?.ipAddress,
    });

    return { rawToken, expiresIn };
  }

  async refresh(
    rawRefreshToken: string,
    options?: { deviceInfo?: string; ipAddress?: string },
  ) {
    const tokenHash = this.hashToken(rawRefreshToken);

    // find + revoke를 단일 쿼리로 처리 → race condition 방지
    const stored = await this.repository.revokeValidRefreshToken(tokenHash);
    if (!stored) {
      this.logger.warn('Refresh token not found or invalid');
      const expired = await this.repository.findRefreshTokenByHash(tokenHash);
      if (expired) {
        throw new UnauthorizedException({
          code: ErrorCode.TOKEN_EXPIRED,
          message: 'refresh token이 만료되었습니다.',
        });
      }
      throw new UnauthorizedException({
        code: ErrorCode.TOKEN_INVALID,
        message: '유효하지 않은 refresh token입니다.',
      });
    }

    const user = await this.repository.findUserById(stored.userId);
    if (!user) {
      this.logger.warn(`User not found: ${stored.userId}`);
      throw new UnauthorizedException({
        code: ErrorCode.TOKEN_INVALID,
        message: '유효하지 않은 refresh token입니다.',
      });
    }

    this.logger.debug(`Token refreshed for user: ${user.id}`);
    const payload: JwtPayload = {
      id: user.id,
      role: user.role as UserRole,
      scope: user.role === 'admin' ? ['admin'] : [],
    };

    const [accessToken, { rawToken: refreshToken, expiresIn: refreshExpiresIn }] = await Promise.all([
      this.issueAccessToken(payload),
      this.issueRefreshToken(user.id, options),
    ]);
    return { accessToken, refreshToken, refreshExpiresIn };
  }

  async logout(rawRefreshToken: string): Promise<void> {
    const tokenHash = this.hashToken(rawRefreshToken);

    // 이미 만료/무효화된 토큰 → idempotent: 로그아웃된 상태로 간주하고 성공 처리
    const revoked = await this.repository.revokeValidRefreshToken(tokenHash);
    if (!revoked) {
      this.logger.debug('Logout called with invalid or expired token (idempotent)');
      return;
    }

    this.logger.debug(`User logged out: ${revoked.userId}`);
  }
}

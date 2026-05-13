import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthRepository } from './auth.repository';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomBytes } from 'crypto';
import type { JwtPayload } from '../common/types/jwt-payload.type';

@Injectable()
export class AuthService {
  constructor(
    private readonly repository: AuthRepository,
    private readonly jwtService: JwtService,
  ) {}

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  async issueAccessToken(payload: JwtPayload): Promise<string> {
    return await this.jwtService.signAsync(payload);
  }

  async issueRefreshToken(userId: string): Promise<string> {
    const rawToken = randomBytes(40).toString('hex');
    const tokenHash = this.hashToken(rawToken);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 14);

    await this.repository.saveRefreshToken({ userId, tokenHash, expiresAt });

    return rawToken;
  }

  async refresh(rawRefreshToken: string) {
    const tokenHash = this.hashToken(rawRefreshToken);
    const stored = await this.repository.findValidRefreshToken(tokenHash);

    if (!stored) {
      throw new UnauthorizedException('토큰이 유효하지 않습니다');
    }

    await this.repository.revokeRefreshToken(stored.userId, tokenHash);

    const user = await this.repository.findUserById(stored.userId);
    if (!user) {
      throw new UnauthorizedException('토큰이 유효하지 않습니다');
    }

    const payload: JwtPayload = {
      id: user.id,
      role: user.role,
      scope: user.role === 'admin' ? ['admin'] : [],
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.issueAccessToken(payload),
      this.issueRefreshToken(user.id),
    ]);
    return { accessToken, refreshToken };
  }
}

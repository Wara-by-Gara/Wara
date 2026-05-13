import { Injectable } from '@nestjs/common';
import { AuthRepository } from './auth.repository';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomBytes } from 'crypto';
import type { JwtPayload } from 'src/common/types/jwt-payload.type';

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
    expiresAt.setDate(expiresAt.getDate() + 30);

    await this.repository.saveRefreshToken({ userId, tokenHash, expiresAt });

    return rawToken;
  }
}

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import appleSignin from 'apple-signin-auth';
import { AppleCallbackDto } from './apple-callback.dto';
import { AuthRepository } from '../auth.repository';
import { AuthService } from '../auth.service';
import type { JwtPayload } from '../../common/types/jwt-payload.type';

export interface AppleLoginResult {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AppleService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly authRepository: AuthRepository,
    private readonly authService: AuthService,
  ) {}

  generateState(): string {
    return this.jwtService.sign(
      { nonce: randomUUID() },
      { secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'), expiresIn: '10m' },
    );
  }

  async login(dto: AppleCallbackDto): Promise<AppleLoginResult> {
    if (dto.state) {
      this.verifyState(dto.state);
    }

    const payload = await this.verifyIdToken(dto.id_token);

    const name = dto.user?.name
      ? [dto.user.name.firstName, dto.user.name.lastName].filter(Boolean).join(' ')
      : undefined;

    const { userId } = await this.authRepository.upsertSocialAccount({
      provider: 'apple',
      providerAccountId: payload.sub,
      email: payload.email ?? dto.user?.email,
      name,
    });

    const user = await this.authRepository.findUserById(userId);
    if (!user) {
      throw new UnauthorizedException('유저 정보를 찾을 수 없습니다.');
    }

    const jwtPayload: JwtPayload = {
      id: user.id,
      role: user.role,
      scope: user.role === 'admin' ? ['admin'] : [],
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.authService.issueAccessToken(jwtPayload),
      this.authService.issueRefreshToken(userId),
    ]);

    return { accessToken, refreshToken };
  }

  private verifyState(state: string): void {
    try {
      this.jwtService.verify(state, {
        secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('유효하지 않은 state입니다.');
    }
  }

  private async verifyIdToken(idToken: string) {
    try {
      return await appleSignin.verifyIdToken(idToken, {
        audience: this.config.getOrThrow<string>('APPLE_CLIENT_ID'),
      });
    } catch {
      throw new UnauthorizedException('유효하지 않은 Apple id_token입니다.');
    }
  }
}

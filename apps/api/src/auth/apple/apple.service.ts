import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import appleSignin from 'apple-signin-auth';
import { AppleCallbackDto } from './apple-callback.dto';
import { AuthRepository } from '../auth.repository';

export interface AppleLoginResult {
  userId: string;
  isNew: boolean;
}

@Injectable()
export class AppleService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly authRepository: AuthRepository,
  ) {}

  async login(dto: AppleCallbackDto): Promise<AppleLoginResult> {
    if (dto.state) {
      this.verifyState(dto.state);
    }

    const payload = await this.verifyIdToken(dto.id_token);

    const name = dto.user?.name
      ? [dto.user.name.firstName, dto.user.name.lastName].filter(Boolean).join(' ')
      : undefined;

    const result = await this.authRepository.upsertSocialAccount({
      provider: 'apple',
      providerAccountId: payload.sub,
      email: payload.email ?? dto.user?.email,
      name,
    });

    // TODO: 숙희님(JWT) 작업 머지 후 추가
    // - access token + refresh token 발급
    // - refresh token hash → refresh_tokens 테이블 저장

    return result;
  }

  private verifyState(state: string): void {
    try {
      this.jwtService.verify(state, {
        secret: this.config.getOrThrow<string>('JWT_SECRET'),
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

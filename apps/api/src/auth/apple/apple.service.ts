import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import appleSignin from 'apple-signin-auth';
import { AppleCallbackDto } from './apple-callback.dto';

export interface AppleVerifiedPayload {
  sub: string;        // Apple 유저 고유 ID (socialAccounts.provider_account_id)
  email: string | undefined;
  name: string | undefined;  // 최초 로그인 1회만 존재
}

@Injectable()
export class AppleService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async verifyAndExtract(dto: AppleCallbackDto): Promise<AppleVerifiedPayload> {
    if (dto.state) {
      this.verifyState(dto.state);
    }

    const payload = await this.verifyIdToken(dto.id_token);

    const name = dto.user?.name
      ? [dto.user.name.firstName, dto.user.name.lastName].filter(Boolean).join(' ')
      : undefined;

    return {
      sub: payload.sub,
      email: payload.email ?? dto.user?.email,
      name,
    };
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

  // TODO: 하림님(Repository) 작업 머지 후 아래 로직 추가
  // - socialAccounts에서 provider='apple', provider_account_id=sub로 유저 조회
  // - 없으면 users + socialAccounts 신규 생성 (최초 가입)
  // - 있으면 last_login_at 업데이트
  // - SHA-256(refreshToken) → users.refresh_token 저장 (Naver 패턴 동일)

  // TODO: 숙희님(JWT) 작업 머지 후 아래 로직 추가
  // - access token + refresh token 발급
  // - refresh token SHA-256 해시 → users.refresh_token 컬럼에 저장
}

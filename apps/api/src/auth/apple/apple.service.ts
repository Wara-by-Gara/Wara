import { Injectable, UnauthorizedException } from '@nestjs/common';
import appleSignin from 'apple-signin-auth';
import { AppleCallbackDto } from './apple-callback.dto';

export interface AppleVerifiedPayload {
  sub: string;        // Apple 유저 고유 ID (socialAccounts.provider_account_id)
  email: string | undefined;
  name: string | undefined;  // 최초 로그인 1회만 존재
}

@Injectable()
export class AppleService {
  async verifyAndExtract(dto: AppleCallbackDto): Promise<AppleVerifiedPayload> {
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

  private async verifyIdToken(idToken: string) {
    try {
      return await appleSignin.verifyIdToken(idToken, {
        audience: process.env.APPLE_CLIENT_ID,
        // Apple JWKS 공개키로 서명 검증 + 만료 여부 확인
      });
    } catch {
      throw new UnauthorizedException('유효하지 않은 Apple id_token입니다.');
    }
  }

  // TODO: 하림님(Repository) 작업 머지 후 아래 로직 추가
  // - socialAccounts에서 provider='apple', provider_account_id=sub로 유저 조회
  // - 없으면 users + socialAccounts 신규 생성 (최초 가입)
  // - 있으면 last_login_at 업데이트

  // TODO: 숙희님(JWT) 작업 머지 후 아래 로직 추가
  // - access token + refresh token 발급
  // - refresh token 저장 (영서님 세션/쿠키 설계 확인 후)
}

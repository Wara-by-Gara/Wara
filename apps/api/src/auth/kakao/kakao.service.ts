import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { AuthRepository } from '../auth.repository';
import { AuthService } from '../auth.service';
import { KakaoLoginDto } from './kakao-login.dto';
import { ErrorCode } from '../../common/constants/error-codes';
import { UserRole } from '../../common/enums/role.enum';

class KakaoProfile {
  nickname?: string;
  profile_image_url?: string;
}

class KakaoAccount {
  email?: string;
  profile?: KakaoProfile;
}

class KakaoUserInfo {
  id: number;
  kakao_account?: KakaoAccount;
}

class KakaoTokenResponse {
  access_token: string;
  token_type: string;
  refresh_token: string;
  expires_in: number;
}

@Injectable()
export class KakaoService {
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly callbackUrl: string;

  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly authRepository: AuthRepository,
    private readonly authService: AuthService,
  ) {
    this.clientId = this.config.getOrThrow<string>('KAKAO_CLIENT_ID');
    this.clientSecret = this.config.getOrThrow<string>('KAKAO_CLIENT_SECRET');
    this.callbackUrl = this.config.getOrThrow<string>('KAKAO_REDIRECT_URI');
  }

  /**
   * iOS SDK / 웹 JS SDK 방식
   * 클라이언트가 Kakao SDK로 직접 발급받은 accessToken을 전달
   */
  async loginWithToken(dto: KakaoLoginDto): Promise<{ accessToken: string; refreshToken: string; isNew: boolean }> {
    const profile = await this.fetchKakaoProfile(dto.accessToken);
    return this.processLogin(profile);
  }

  /**
   * 웹 서버사이드 OAuth 방식
   * 카카오 인증 서버가 code와 함께 callback으로 리다이렉트한 경우
   */
  async loginWithCode(code: string): Promise<{ accessToken: string; refreshToken: string; isNew: boolean }> {
    const kakaoTokens = await this.exchangeCodeForTokens(code);
    const profile = await this.fetchKakaoProfile(kakaoTokens.access_token);
    return this.processLogin(profile);
  }

  /**
   * 웹 브라우저가 카카오 로그인 페이지로 이동할 URL 반환
   * state로 CSRF 방지
   */
  getAuthorizationUrl(): string {
    const state = this.generateState();

    const url = new URL('https://kauth.kakao.com/oauth/authorize');
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('client_id', this.clientId);
    url.searchParams.set('redirect_uri', this.callbackUrl);
    url.searchParams.set('state', state);

    return url.toString();
  }

  private async processLogin(
    profile: KakaoUserInfo,
  ): Promise<{ accessToken: string; refreshToken: string; isNew: boolean }> {
    const rawProfile = profile;

    const result = await this.authRepository.upsertSocialAccount({
      provider: 'kakao',
      providerAccountId: String(profile.id),
      email: profile.kakao_account?.email,
      name: profile.kakao_account?.profile?.nickname,
      profileImageUrl: profile.kakao_account?.profile?.profile_image_url,
      rawProfile,
    });

    const payload = {
      id: result.userId,
      role: UserRole.MEMBER,
      scope: [] as string[],
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.authService.issueAccessToken(payload),
      this.authService.issueRefreshToken(result.userId),
    ]);

    return { accessToken, refreshToken, isNew: result.isNew };
  }

  private async fetchKakaoProfile(accessToken: string): Promise<KakaoUserInfo> {
    const response = await fetch('https://kapi.kakao.com/v2/user/me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
      },
    });

    if (!response.ok) {
      throw new UnauthorizedException({
        code: ErrorCode.AUTH_INVALID_TOKEN,
        message: '유효하지 않은 카카오 액세스 토큰입니다.',
      });
    }

    return response.json() as Promise<KakaoUserInfo>;
  }

  private async exchangeCodeForTokens(code: string): Promise<KakaoTokenResponse> {
    const url = new URL('https://kauth.kakao.com/oauth/token');
    url.searchParams.set('grant_type', 'authorization_code');
    url.searchParams.set('client_id', this.clientId);
    url.searchParams.set('client_secret', this.clientSecret);
    url.searchParams.set('redirect_uri', this.callbackUrl);
    url.searchParams.set('code', code);

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8' },
    });

    if (!response.ok) {
      throw new UnauthorizedException({
        code: ErrorCode.AUTH_INVALID_TOKEN,
        message: '카카오 인증 코드 교환에 실패했습니다.',
      });
    }

    return response.json() as Promise<KakaoTokenResponse>;
  }

  private generateState(): string {
    return this.jwtService.sign(
      { nonce: randomUUID() },
      {
        secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
        expiresIn: '10m' as const,
      },
    );
  }
}

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { createHash, randomUUID } from 'crypto';
import { AuthRepository } from '../auth.repository';
import { KakaoLoginDto } from './kakao-login.dto';

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

export class AuthTokensResult {
  accessToken: string;
  refreshToken: string;
  isNew: boolean;
}

@Injectable()
export class KakaoService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly authRepository: AuthRepository,
  ) {}

  /**
   * iOS SDK / 웹 JS SDK 방식
   * 클라이언트가 Kakao SDK로 직접 발급받은 accessToken을 전달
   */
  async loginWithToken(dto: KakaoLoginDto): Promise<AuthTokensResult> {
    const profile = await this.fetchKakaoProfile(dto.accessToken);
    return this.processLogin(profile);
  }

  /**
   * 웹 서버사이드 OAuth 방식
   * 카카오 인증 서버가 code와 함께 callback으로 리다이렉트한 경우
   */
  async loginWithCode(code: string): Promise<AuthTokensResult> {
    const kakaoTokens = await this.exchangeCodeForTokens(code);
    const profile = await this.fetchKakaoProfile(kakaoTokens.access_token);
    return this.processLogin(profile);
  }

  /**
   * 웹 브라우저가 카카오 로그인 페이지로 이동할 URL 반환
   * state로 CSRF 방지
   */
  getAuthorizationUrl(): string {
    const clientId = this.config.getOrThrow<string>('KAKAO_CLIENT_ID');
    const redirectUri = this.config.getOrThrow<string>('KAKAO_REDIRECT_URI');
    const state = this.generateState();

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      redirect_uri: redirectUri,
      state,
    });

    return `https://kauth.kakao.com/oauth/authorize?${params.toString()}`;
  }

  private async processLogin(profile: KakaoUserInfo): Promise<AuthTokensResult> {
    const result = await this.authRepository.upsertSocialAccount({
      provider: 'kakao',
      providerAccountId: String(profile.id),
      email: profile.kakao_account?.email,
      name: profile.kakao_account?.profile?.nickname,
      profileImageUrl: profile.kakao_account?.profile?.profile_image_url,
    });

    const tokens = this.issueJwt(result.userId, 'member');

    const refreshExpiresAt = new Date();
    refreshExpiresAt.setDate(refreshExpiresAt.getDate() + 7);

    await this.authRepository.saveRefreshToken({
      userId: result.userId,
      tokenHash: createHash('sha256').update(tokens.refreshToken).digest('hex'),
      expiresAt: refreshExpiresAt,
    });

    const tokenResult = new AuthTokensResult();
    tokenResult.accessToken = tokens.accessToken;
    tokenResult.refreshToken = tokens.refreshToken;
    tokenResult.isNew = result.isNew;
    return tokenResult;
  }

  private async fetchKakaoProfile(accessToken: string): Promise<KakaoUserInfo> {
    const response = await fetch('https://kapi.kakao.com/v2/user/me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
      },
    });

    if (!response.ok) {
      throw new UnauthorizedException('유효하지 않은 카카오 액세스 토큰입니다.');
    }

    return response.json() as Promise<KakaoUserInfo>;
  }

  private async exchangeCodeForTokens(code: string): Promise<KakaoTokenResponse> {
    const clientId = this.config.getOrThrow<string>('KAKAO_CLIENT_ID');
    const clientSecret = this.config.get<string>('KAKAO_CLIENT_SECRET');
    const redirectUri = this.config.getOrThrow<string>('KAKAO_REDIRECT_URI');

    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: clientId,
      redirect_uri: redirectUri,
      code,
      ...(clientSecret ? { client_secret: clientSecret } : {}),
    });

    const response = await fetch('https://kauth.kakao.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8' },
      body: params.toString(),
    });

    if (!response.ok) {
      throw new UnauthorizedException('카카오 인증 코드 교환에 실패했습니다.');
    }

    return response.json() as Promise<KakaoTokenResponse>;
  }

  private generateState(): string {
    return this.jwtService.sign(
      { nonce: randomUUID() },
      {
        secret: this.config.getOrThrow<string>('JWT_SECRET'),
        expiresIn: '10m',
      },
    );
  }

  private issueJwt(
    userId: string,
    role: string,
  ): { accessToken: string; refreshToken: string } {
    const accessExpiresIn = (this.config.get('JWT_EXPIRES_IN') ?? '15m') as `${number}${'s' | 'm' | 'h' | 'd'}`;
    const refreshExpiresIn = (this.config.get('JWT_REFRESH_EXPIRES_IN') ?? '7d') as `${number}${'s' | 'm' | 'h' | 'd'}`;

    const accessToken = this.jwtService.sign(
      { id: userId, role },
      {
        secret: this.config.getOrThrow<string>('JWT_SECRET'),
        expiresIn: accessExpiresIn,
      },
    );

    const refreshToken = this.jwtService.sign(
      { id: userId },
      {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: refreshExpiresIn,
      },
    );

    return { accessToken, refreshToken };
  }
}

import { Inject, Injectable, Optional, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { AuthRepository } from '../auth.repository';
import { AuthService } from '../auth.service';
import { ADMIN_BOOTSTRAP_SERVICE, IAdminBootstrapService } from '../interfaces/admin-bootstrap.interface';

interface NaverTokenResponse {
  access_token?: string;
  error?: string;
  error_description?: string;
}

interface NaverProfileResponse {
  resultcode: string;
  message: string;
  response: {
    id: string;
    email?: string;
    name?: string;
    profile_image?: string;
  };
}

@Injectable()
export class NaverService {
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly callbackUrl: string;

  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly authRepository: AuthRepository,
    private readonly authService: AuthService,
    @Optional() @Inject(ADMIN_BOOTSTRAP_SERVICE) private readonly adminBootstrapService: IAdminBootstrapService | undefined,
  ) {
    this.clientId = this.config.getOrThrow<string>('NAVER_CLIENT_ID');
    this.clientSecret = this.config.getOrThrow<string>('NAVER_CLIENT_SECRET');
    this.callbackUrl = this.config.getOrThrow<string>('NAVER_CALLBACK_URL');
  }

  getAuthUrl(): string {
    const state = this.jwtService.sign(
      { nonce: randomUUID() },
      {
        secret: this.config.getOrThrow<string>('JWT_SECRET'),
        expiresIn: '10m',
      },
    );

    const url = new URL('https://nid.naver.com/oauth2.0/authorize');
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('client_id', this.clientId);
    url.searchParams.set('redirect_uri', this.callbackUrl);
    url.searchParams.set('state', state);

    return url.toString();
  }

  async handleCallback(code: string, state: string): Promise<{ accessToken: string; refreshToken: string }> {
    this.verifyState(state);

    const naverAccessToken = await this.exchangeCodeForToken(code, state);
    const profile = await this.fetchNaverProfile(naverAccessToken);

    const user = await this.authRepository.upsertUserBySocial({
      provider: 'naver',
      providerAccountId: profile.id,
      email: profile.email,
      name: profile.name,
      profileImageUrl: profile.profile_image,
      rawProfile: profile,
    });

    if (this.adminBootstrapService) {
      await this.adminBootstrapService.ensureAdminRoleIfEligible(user.id);
    }

    return this.authService.issueTokens(user);
  }

  private verifyState(state: string): void {
    try {
      this.jwtService.verify(state, {
        secret: this.config.getOrThrow<string>('JWT_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired state');
    }
  }

  private async exchangeCodeForToken(code: string, state: string): Promise<string> {
    const url = new URL('https://nid.naver.com/oauth2.0/token');
    url.searchParams.set('grant_type', 'authorization_code');
    url.searchParams.set('client_id', this.clientId);
    url.searchParams.set('client_secret', this.clientSecret);
    url.searchParams.set('redirect_uri', this.callbackUrl);
    url.searchParams.set('code', code);
    url.searchParams.set('state', state);

    const response = await fetch(url.toString());
    const data = (await response.json()) as NaverTokenResponse;

    if (data.error || !data.access_token) {
      throw new UnauthorizedException('Naver token exchange failed');
    }

    return data.access_token;
  }

  private async fetchNaverProfile(accessToken: string): Promise<NaverProfileResponse['response']> {
    const response = await fetch('https://openapi.naver.com/v1/nid/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const data = (await response.json()) as NaverProfileResponse;

    if (data.resultcode !== '00') {
      throw new UnauthorizedException('Naver profile fetch failed');
    }

    return data.response;
  }
}

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { OAuth2Client } from 'google-auth-library';
import { Platform } from '../enums/platform.enum';
import { Provider } from '../enums/provider.enum';
import { SocialUser } from '../types/social-user.type';
import {
  SocialAuthParams,
  SocialStrategy,
} from './interfaces/social.strategy.interface';
import { ErrorCode } from '../../common/constants/error-codes';

@Injectable()
export class GoogleStrategy implements SocialStrategy {
  readonly provider = Provider.GOOGLE;
  readonly supportedPlatforms = [Platform.WEB, Platform.MOBILE];
  private readonly googleClient = new OAuth2Client();

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  getAuthorizationUrl(_platform: Platform, state: string): string {
    const params = new URLSearchParams({
      client_id: this.configService.getOrThrow<string>('GOOGLE_CLIENT_ID'),
      redirect_uri: this.configService.getOrThrow<string>('GOOGLE_REDIRECT_URI'),
      response_type: 'code',
      scope: 'openid email profile',
      state,
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  async authenticate(params: SocialAuthParams): Promise<SocialUser> {
    const tokenResponse = await firstValueFrom(
      this.httpService.post(
        'https://oauth2.googleapis.com/token',

        new URLSearchParams({
          code: params.code,
          client_id: this.configService.getOrThrow<string>('GOOGLE_CLIENT_ID'),
          client_secret: this.configService.getOrThrow<string>('GOOGLE_CLIENT_SECRET'),
          redirect_uri: this.configService.getOrThrow<string>('GOOGLE_REDIRECT_URI'),
          grant_type: 'authorization_code',
        }),

        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      ),
    );

    const accessToken = tokenResponse.data.access_token;

    const userResponse = await firstValueFrom(
      this.httpService.get(
        'https://www.googleapis.com/oauth2/v2/userinfo',

        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      ),
    );

    const user = userResponse.data;

    return {
      provider: this.provider,
      providerAccountId: user.id,
      email: user.email ?? undefined,
      name: user.name ?? undefined,
      gender: undefined,
      birthYear: undefined,
      profileImage: user.picture ?? undefined,
    };
  }

  async authenticateWithProviderToken(idToken: string): Promise<SocialUser> {
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken,
        audience: this.configService.getOrThrow<string>('GOOGLE_MOBILE_CLIENT_ID'),
      });
      const payload = ticket.getPayload();
      if (!payload) throw new Error('empty payload');
      return {
        provider: this.provider,
        providerAccountId: payload.sub,
        email: payload.email ?? undefined,
        name: payload.name ?? undefined,
        gender: undefined,
        birthYear: undefined,
        profileImage: payload.picture ?? undefined,
      };
    } catch {
      throw new UnauthorizedException({
        code: ErrorCode.AUTH_PROVIDER_TOKEN_INVALID,
        message: '유효하지 않은 Google id_token입니다.',
      });
    }
  }
}

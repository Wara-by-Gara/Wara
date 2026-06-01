import { Injectable, UnauthorizedException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { Platform } from '../enums/platform.enum';
import { Provider } from '../enums/provider.enum';
import { SocialUser } from '../types/social-user.type';
import {
  SocialAuthParams,
  SocialStrategy,
} from './interfaces/social.strategy.interface';
import { ErrorCode } from '../../common/constants/error-codes';

@Injectable()
export class NaverStrategy implements SocialStrategy {
  readonly provider = Provider.NAVER;
  readonly supportedPlatforms = [Platform.WEB, Platform.MOBILE];

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  getAuthorizationUrl(_platform: Platform, state: string): string {
    const params = new URLSearchParams({
      client_id: this.configService.getOrThrow<string>('NAVER_CLIENT_ID'),
      redirect_uri: this.configService.getOrThrow<string>('NAVER_CALLBACK_URL'),
      response_type: 'code',
      state,
    });

    return `https://nid.naver.com/oauth2.0/authorize?${params.toString()}`;
  }

  async authenticate(params: SocialAuthParams): Promise<SocialUser> {
    const tokenResponse = await firstValueFrom(
      this.httpService.post(
        'https://nid.naver.com/oauth2.0/token',

        null,

        {
          params: {
            grant_type: 'authorization_code',
            client_id: this.configService.getOrThrow<string>('NAVER_CLIENT_ID'),
            client_secret: this.configService.getOrThrow<string>('NAVER_CLIENT_SECRET'),
            code: params.code,
            state: params.state,
          },
        },
      ),
    );

    const accessToken = tokenResponse.data.access_token;

    const userResponse = await firstValueFrom(
      this.httpService.get(
        'https://openapi.naver.com/v1/nid/me',

        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      ),
    );

    const user = userResponse.data.response;

    return {
      provider: this.provider,
      providerAccountId: user.id,
      name: user.name ?? undefined,
      gender:
        user.gender === 'M'
          ? 'male'
          : user.gender === 'F'
            ? 'female'
            : undefined,
      birthYear: user.birthyear ?? undefined,
      email: user.email ?? undefined,
      profileImage: user.profile_image ?? undefined,
    };
  }

  async authenticateWithProviderToken(accessToken: string): Promise<SocialUser> {
    try {
      const userResponse = await firstValueFrom(
        this.httpService.get('https://openapi.naver.com/v1/nid/me', {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
      );
      const user = userResponse.data.response;
      return {
        provider: this.provider,
        providerAccountId: user.id,
        name: user.name ?? undefined,
        gender:
          user.gender === 'M'
            ? 'male'
            : user.gender === 'F'
              ? 'female'
              : undefined,
        birthYear: user.birthyear ?? undefined,
        email: user.email ?? undefined,
        profileImage: user.profile_image ?? undefined,
      };
    } catch {
      throw new UnauthorizedException({
        code: ErrorCode.AUTH_PROVIDER_TOKEN_INVALID,
        message: '유효하지 않은 Naver access token입니다.',
      });
    }
  }
}

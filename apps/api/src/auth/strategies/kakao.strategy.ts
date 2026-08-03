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
export class KakaoStrategy implements SocialStrategy {
  readonly provider = Provider.KAKAO;
  readonly supportedPlatforms = [Platform.WEB, Platform.MOBILE];

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  getAuthorizationUrl(_platform: Platform, state: string): string {
    const params = new URLSearchParams({
      client_id: this.configService.getOrThrow<string>('KAKAO_CLIENT_ID'),
      redirect_uri: this.configService.getOrThrow<string>('KAKAO_REDIRECT_URI'),
      response_type: 'code',
      // 카카오 콘솔에 권한 있는 항목만 요청. name/gender/birthyear는 비즈앱 검수 필요 — 승인 후 추가.
      scope: 'profile_nickname,profile_image,account_email',
      state,
    });

    return `https://kauth.kakao.com/oauth/authorize?${params.toString()}`;
  }

  async authenticate(params: SocialAuthParams): Promise<SocialUser> {
    const tokenResponse = await firstValueFrom(
      this.httpService.post(
        'https://kauth.kakao.com/oauth/token',

        new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: this.configService.getOrThrow<string>('KAKAO_CLIENT_ID'),
          client_secret: this.configService.get<string>('KAKAO_CLIENT_SECRET') ?? '',
          redirect_uri: params.redirectUri ?? this.configService.getOrThrow<string>('KAKAO_REDIRECT_URI'),
          code: params.code,
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
        'https://kapi.kakao.com/v2/user/me',

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
      providerAccountId: String(user.id),
      name: user.properties?.nickname ?? undefined,
      gender: user.kakao_account?.gender ?? undefined,
      birthYear: user.kakao_account?.birthyear ?? undefined,
      email: user.kakao_account?.email ?? undefined,
      profileImage: user.properties?.profile_image ?? undefined,
    };
  }

  async authenticateWithProviderToken(accessToken: string): Promise<SocialUser> {
    try {
      const userResponse = await firstValueFrom(
        this.httpService.get('https://kapi.kakao.com/v2/user/me', {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
      );
      const user = userResponse.data;
      return {
        provider: this.provider,
        providerAccountId: String(user.id),
        // 본명(name) 우선, 없으면 nickname (profile_nickname scope만 받은 경우)
        name: user.kakao_account?.name ?? user.properties?.nickname ?? undefined,
        gender: user.kakao_account?.gender ?? undefined,
        birthYear: user.kakao_account?.birthyear ?? undefined,
        email: user.kakao_account?.email ?? undefined,
        profileImage: user.properties?.profile_image ?? undefined,
      };
    } catch {
      throw new UnauthorizedException({
        code: ErrorCode.AUTH_PROVIDER_TOKEN_INVALID,
        message: '유효하지 않은 Kakao access token입니다.',
      });
    }
  }
}

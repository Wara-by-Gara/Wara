import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { Platform } from '../enums/platform.enum';
import { Provider } from '../enums/provider.enum';
import { SocialUser } from '../types/social-user.type';
import {
  SocialAuthParams,
  SocialStrategy,
} from './interfaces/social.strategy.interface';

@Injectable()
export class KakaoStrategy implements SocialStrategy {
  readonly provider = Provider.KAKAO;
  readonly supportedPlatforms = [Platform.WEB, Platform.MOBILE];

  constructor(private readonly httpService: HttpService) {}

  getAuthorizationUrl(_platform: Platform): string {
    const params = new URLSearchParams({
      client_id: process.env.KAKAO_CLIENT_ID!,
      redirect_uri: process.env.KAKAO_REDIRECT_URI!,
      response_type: 'code',
    });

    return `https://kauth.kakao.com/oauth/authorize?${params.toString()}`;
  }

  async authenticate(params: SocialAuthParams): Promise<SocialUser> {
    const tokenResponse = await firstValueFrom(
      this.httpService.post(
        'https://kauth.kakao.com/oauth/token',

        new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: process.env.KAKAO_CLIENT_ID!,
          redirect_uri: process.env.KAKAO_REDIRECT_URI!,
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
}

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
export class NaverStrategy implements SocialStrategy {
  readonly provider = Provider.NAVER;
  readonly supportedPlatforms = [Platform.WEB, Platform.MOBILE];

  constructor(private readonly httpService: HttpService) {}

  getAuthorizationUrl(_platform: Platform): string {
    const params = new URLSearchParams({
      client_id: process.env.NAVER_CLIENT_ID!,
      redirect_uri: process.env.NAVER_REDIRECT_URI!,
      response_type: 'code',
      state: 'wara',
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
            client_id: process.env.NAVER_CLIENT_ID!,
            client_secret: process.env.NAVER_CLIENT_SECRET!,
            code: params.code,
            state: params.state ?? 'wara',
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
}

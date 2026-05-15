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
export class GoogleStrategy implements SocialStrategy {
  readonly provider = Provider.GOOGLE;
  readonly supportedPlatforms = [Platform.WEB];

  constructor(private readonly httpService: HttpService) {}

  getAuthorizationUrl(_platform: Platform): string {
    const params = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
      response_type: 'code',
      scope: 'openid email profile',
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  async authenticate(params: SocialAuthParams): Promise<SocialUser> {
    const tokenResponse = await firstValueFrom(
      this.httpService.post(
        'https://oauth2.googleapis.com/token',

        new URLSearchParams({
          code: params.code,
          client_id: process.env.GOOGLE_CLIENT_ID!,
          client_secret: process.env.GOOGLE_CLIENT_SECRET!,
          redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
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
}

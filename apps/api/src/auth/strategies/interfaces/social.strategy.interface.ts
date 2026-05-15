import { Platform } from '../../enums/platform.enum';
import { SocialUser } from '../../types/social-user.type';

export interface SocialAuthParams {
  code: string;
  state?: string;
  platform: Platform;
}

export interface SocialStrategy {
  getAuthorizationUrl(platform: Platform): string;

  authenticate(params: SocialAuthParams): Promise<SocialUser>;
}

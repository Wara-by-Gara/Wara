import { ForbiddenException, Injectable } from '@nestjs/common';
import { Platform } from './enums/platform.enum';
import { Provider } from './enums/provider.enum';

@Injectable()
export class OauthPolicyService {
  private readonly policies: Record<Provider, Platform[]> = {
    [Provider.GOOGLE]: [Platform.WEB, Platform.MOBILE],
    [Provider.KAKAO]: [Platform.WEB, Platform.MOBILE],
    [Provider.NAVER]: [Platform.WEB, Platform.MOBILE],
    [Provider.APPLE]: [Platform.WEB, Platform.MOBILE],
  };

  validatePlatform(provider: Provider, platform: Platform): void {
    const supportedPlatforms = this.policies[provider];

    if (!supportedPlatforms.includes(platform)) {
      throw new ForbiddenException(
        `${provider} login is not supported on ${platform}`,
      );
    }
  }

  isSupportedPlatform(provider: Provider, platform: Platform): boolean {
    return this.policies[provider].includes(platform);
  }

  getSupportedPlatforms(provider: Provider): Platform[] {
    return this.policies[provider];
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { Provider } from './enums/provider.enum';
import { GoogleStrategy } from './strategies/google.strategy';
import { KakaoStrategy } from './strategies/kakao.strategy';
import { NaverStrategy } from './strategies/naver.strategy';
import { SocialStrategy } from './strategies/interfaces/social.strategy.interface';

@Injectable()
export class SocialAuthFactory {
  private readonly strategies: Map<Provider, SocialStrategy>;

  constructor(
    private readonly googleStrategy: GoogleStrategy,
    private readonly kakaoStrategy: KakaoStrategy,
    private readonly naverStrategy: NaverStrategy,
  ) {
    this.strategies = new Map<Provider, SocialStrategy>([
      [Provider.GOOGLE, this.googleStrategy],
      [Provider.KAKAO, this.kakaoStrategy],
      [Provider.NAVER, this.naverStrategy],
    ]);
  }

  getStrategy(provider: Provider): SocialStrategy {
    const strategy = this.strategies.get(provider);

    if (!strategy) {
      throw new NotFoundException(`Unsupported provider: ${provider}`);
    }

    return strategy;
  }
}

import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public } from '../common/decorators/public.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { RefreshTokenDto, RefreshTokenSchema } from './dto/refresh-token.dto';
import {
  ProviderParamDto,
  ProviderParamSchema,
} from './dto/provider.param.dto';
import {
  SocialCallbackDto,
  SocialCallbackSchema,
} from './dto/social-callback.dto';
import { Platform } from './enums/platform.enum';
import { SocialAuthFactory } from './social-auth.factory';
import { OauthPolicyService } from './oauth-policy.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly socialAuthFactory: SocialAuthFactory,
    private readonly oauthPolicyService: OauthPolicyService,
  ) {}

  @Public()
  @Get(':provider')
  getAuthorizationUrl(
    @Param(new ZodValidationPipe(ProviderParamSchema))
    params: ProviderParamDto,

    @Query('platform')
    platform: Platform,
  ) {
    this.oauthPolicyService.validatePlatform(params.provider, platform);

    const strategy = this.socialAuthFactory.getStrategy(params.provider);

    return {
      url: strategy.getAuthorizationUrl(platform),
    };
  }

  @Public()
  @Get(':provider/callback')
  async socialCallback(
    @Param(new ZodValidationPipe(ProviderParamSchema))
    params: ProviderParamDto,

    @Query(new ZodValidationPipe(SocialCallbackSchema))
    query: SocialCallbackDto,

    @Query('platform')
    platform: Platform,
  ) {
    this.oauthPolicyService.validatePlatform(params.provider, platform);

    return this.authService.socialLogin({
      provider: params.provider,
      platform,
      code: query.code,
      state: query.state,
    });
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refreshTokens(
    @Body(new ZodValidationPipe(RefreshTokenSchema))
    body: RefreshTokenDto,
  ) {
    return this.authService.refresh(body.refreshToken);
  }
}

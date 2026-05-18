import { Public } from './../common/decorators/public.decorator';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
  Post,
  Query,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { RefreshTokenDto, RefreshTokenSchema } from './dto/refresh-token.dto';
import { ProviderParamDto, ProviderParamSchema } from './dto/provider.param.dto';
import { SocialCallbackDto, SocialCallbackSchema } from './dto/social-callback.dto';
import { Platform } from './enums/platform.enum';
import { ErrorCode } from '../common/constants/error-codes';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Public()
  @Get(':provider/url')
  getAuthUrl(
    @Param(new ZodValidationPipe(ProviderParamSchema)) { provider }: ProviderParamDto,
    @Query('platform') platform: Platform,
  ) {
    return this.authService.getAuthorizationUrl(provider, platform);
  }

  @Public()
  @Get(':provider/redirect')
  oauthRedirect(
    @Param(new ZodValidationPipe(ProviderParamSchema)) { provider }: ProviderParamDto,
    @Res() res: Response,
  ) {
    const { url } = this.authService.getAuthorizationUrl(provider, Platform.WEB);
    return res.redirect(url);
  }

  @Public()
  @Get(':provider/callback')
  async oauthCallback(
    @Param(new ZodValidationPipe(ProviderParamSchema)) { provider }: ProviderParamDto,
    @Query('code') code: string,
    @Query('state') state: string,
    @Query('error') error: string,
    @Res() res: Response,
  ) {
    const frontendUrl = this.configService.getOrThrow<string>('FRONTEND_URL');

    if (error || !code) {
      return res.redirect(`${frontendUrl}/create?auth_error=1`);
    }

    try {
      const { accessToken, refreshToken } = await this.authService.socialLogin({
        provider,
        platform: Platform.WEB,
        code,
        state,
      });
      const params = new URLSearchParams({ access_token: accessToken, refresh_token: refreshToken });
      return res.redirect(`${frontendUrl}/create?${params.toString()}`);
    } catch (err) {
      this.logger.error(`OAuth callback failed for ${provider}`, err);
      return res.redirect(`${frontendUrl}/create?auth_error=1`);
    }
  }

  @Public()
  @Post(':provider/callback')
  @HttpCode(HttpStatus.OK)
  socialCallback(
    @Param(new ZodValidationPipe(ProviderParamSchema)) { provider }: ProviderParamDto,
    @Query('platform') platform: Platform,
    @Body(new ZodValidationPipe(SocialCallbackSchema)) body: SocialCallbackDto,
  ) {
    if (body.error) {
      throw new UnauthorizedException({
        code: ErrorCode.AUTH_INVALID_TOKEN,
        message: body.error_description ?? body.error,
      });
    }
    return this.authService.socialLogin({ provider, platform, code: body.code, state: body.state });
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refreshTokens(@Body(new ZodValidationPipe(RefreshTokenSchema)) body: RefreshTokenDto) {
    return this.authService.refresh(body.refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  logout(@Body(new ZodValidationPipe(RefreshTokenSchema)) body: RefreshTokenDto) {
    return this.authService.logout(body.refreshToken);
  }
}

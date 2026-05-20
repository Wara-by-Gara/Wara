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
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { RefreshTokenDto, RefreshTokenSchema } from './dto/refresh-token.dto';
import { ProviderParamDto, ProviderParamSchema } from './dto/provider.param.dto';
import { SocialCallbackDto, SocialCallbackSchema } from './dto/social-callback.dto';
import { Platform } from './enums/platform.enum';
import { ErrorCode } from '../common/constants/error-codes';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Public()
  @Get(':provider/url')
  @ApiOperation({ summary: '소셜 로그인 URL 발급' })
  @ApiResponse({ status: 200, description: '소셜 로그인 URL과 state 반환' })
  getAuthUrl(
    @Param(new ZodValidationPipe(ProviderParamSchema)) { provider }: ProviderParamDto,
    @Query('platform') platform: Platform,
  ) {
    return this.authService.getAuthorizationUrl(provider, platform);
  }

  @Public()
  @Get(':provider/redirect')
  @ApiOperation({ summary: '소셜 로그인 브라우저 리다이렉트 (WEB 전용)' })
  @ApiResponse({ status: 302, description: '소셜 로그인 페이지로 리다이렉트' })
  oauthRedirect(
    @Param(new ZodValidationPipe(ProviderParamSchema)) { provider }: ProviderParamDto,
    @Res() res: Response,
  ) {
    const { url } = this.authService.getAuthorizationUrl(provider, Platform.WEB);
    return res.redirect(url);
  }

  @Public()
  @Get(':provider/callback')
  @ApiOperation({ summary: '소셜 로그인 OAuth 콜백 (WEB 브라우저 리다이렉트)' })
  @ApiResponse({ status: 302, description: '로그인 성공 시 프론트엔드로 토큰과 함께 리다이렉트' })
  @ApiResponse({ status: 302, description: '로그인 실패 시 에러 파라미터와 함께 리다이렉트' })
  async oauthCallback(
    @Param(new ZodValidationPipe(ProviderParamSchema)) { provider }: ProviderParamDto,
    @Query('code') code: string,
    @Query('state') state: string,
    @Query('error') error: string,
    @Res() res: Response,
  ) {
    const frontendUrl = this.configService.getOrThrow<string>('FRONTEND_URL');

    if (error || !code) {
      return res.redirect(`${frontendUrl}/invitations/create?auth_error=1`);
    }

    try {
      const { accessToken, refreshToken } = await this.authService.socialLogin({
        provider,
        platform: Platform.WEB,
        code,
        state,
      });
      const params = new URLSearchParams({ access_token: accessToken, refresh_token: refreshToken });
      return res.redirect(`${frontendUrl}/invitations/create?${params.toString()}`);
    } catch (err) {
      this.logger.error(`OAuth callback failed for ${provider}`, err);
      return res.redirect(`${frontendUrl}/invitations/create?auth_error=1`);
    }
  }

  @Public()
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @Post(':provider/callback')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '소셜 로그인 콜백 처리' })
  @ApiResponse({ status: 200, description: 'accessToken, refreshToken 반환' })
  @ApiResponse({ status: 401, description: 'AUTH_INVALID_STATE | AUTH_INVALID_TOKEN' })
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
  @ApiOperation({ summary: 'Refresh Token으로 새 토큰 쌍 발급' })
  @ApiResponse({ status: 200, description: '새 accessToken, refreshToken 반환' })
  @ApiResponse({ status: 401, description: 'TOKEN_EXPIRED | TOKEN_INVALID' })
  refreshTokens(@Body(new ZodValidationPipe(RefreshTokenSchema)) body: RefreshTokenDto) {
    return this.authService.refresh(body.refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '로그아웃 (Refresh Token 폐기)' })
  @ApiResponse({ status: 204, description: '성공' })
  logout(@Body(new ZodValidationPipe(RefreshTokenSchema)) body: RefreshTokenDto) {
    return this.authService.logout(body.refreshToken);
  }
}

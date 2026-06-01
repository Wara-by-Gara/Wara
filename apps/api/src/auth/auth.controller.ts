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
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { ProviderParamDto, ProviderParamSchema } from './dto/provider.param.dto';
import { SocialCallbackDto, SocialCallbackSchema } from './dto/social-callback.dto';
import { Platform } from './enums/platform.enum';
import { ErrorCode } from '../common/constants/error-codes';

const ACCESS_TOKEN_COOKIE = 'accessToken';
const REFRESH_TOKEN_COOKIE = 'refreshToken';
const IS_LOGGED_IN_COOKIE = 'is_logged_in';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  private setAuthCookies(res: Response, accessToken: string, refreshToken: string): void {
    const isProd = this.configService.get('NODE_ENV') === 'production';
    const accessMaxAge = this.configService.get<number>('JWT_ACCESS_EXPIRES_IN', 1800) * 1000;
    const refreshMaxAge = this.configService.get<number>('JWT_REFRESH_EXPIRES_IN', 1209600) * 1000;
    const base = { httpOnly: true, secure: isProd, sameSite: 'lax' as const, path: '/' };

    res.cookie(ACCESS_TOKEN_COOKIE, accessToken, { ...base, maxAge: accessMaxAge });
    res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, { ...base, maxAge: refreshMaxAge });
    res.cookie(IS_LOGGED_IN_COOKIE, '1', { httpOnly: false, secure: isProd, sameSite: 'lax', path: '/', maxAge: refreshMaxAge });
  }

  private clearAuthCookies(res: Response): void {
    const isProd = this.configService.get('NODE_ENV') === 'production';
    const opts = { httpOnly: true, secure: isProd, sameSite: 'lax' as const, path: '/' };
    res.clearCookie(ACCESS_TOKEN_COOKIE, opts);
    res.clearCookie(REFRESH_TOKEN_COOKIE, opts);
    res.clearCookie(IS_LOGGED_IN_COOKIE, { secure: isProd, sameSite: 'lax' as const, path: '/' });
  }

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
      return res.redirect(`${frontendUrl}/login?auth_error=cancelled`);
    }

    try {
      const { accessToken, refreshToken, needsProfileCompletion } =
        await this.authService.socialLogin({
          provider,
          platform: Platform.WEB,
          code,
          state,
        });
      this.setAuthCookies(res, accessToken, refreshToken);
      if (needsProfileCompletion) {
        return res.redirect(`${frontendUrl}/signup`);
      }
      return res.redirect(`${frontendUrl}/?auth_success=1`);
    } catch (err) {
      this.logger.error(`OAuth callback failed for ${provider}`, err);
      return res.redirect(`${frontendUrl}/login?auth_error=failed`);
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
  async refreshTokens(
    @Req() req: Request,
    @Body() body: { refreshToken?: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    const rawRefreshToken = (req.cookies as Record<string, string>)?.[REFRESH_TOKEN_COOKIE] ?? body?.refreshToken;
    if (!rawRefreshToken) {
      throw new UnauthorizedException({ code: ErrorCode.TOKEN_INVALID, message: '유효하지 않은 refresh token입니다.' });
    }
    const result = await this.authService.refresh(rawRefreshToken);
    this.setAuthCookies(res, result.accessToken, result.refreshToken);
    return { refreshExpiresIn: result.refreshExpiresIn };
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(
    @Req() req: Request,
    @Body() body: { refreshToken?: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    const rawRefreshToken = (req.cookies as Record<string, string>)?.[REFRESH_TOKEN_COOKIE] ?? body?.refreshToken;
    if (rawRefreshToken) {
      await this.authService.logout(rawRefreshToken);
    }
    this.clearAuthCookies(res);
  }
}
